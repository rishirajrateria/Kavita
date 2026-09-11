/**
 * Against PGlite with the real migrations: the crawl store + runner persist crawls and
 * findings (pause → resume → completed), and the generic audit revert restores rows.
 */
import { eq } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb, seedTestContent } from "../helpers/pglite-db";
import { adminAuditLog, faqs, services } from "@/db/schema";
import { audit } from "@/lib/admin/audit";
import {
  checkRevertable,
  diffLines,
  listAuditEntries,
  restoreRedacted,
  revertAuditEntry,
  valuesToRestore,
  REVERTABLE_ENTITIES,
} from "@/lib/admin/revert";
import { listIndexableCoreRoutes } from "@/lib/routes";
import { runSeoHealth } from "@/lib/seo-health/runner";
import { DbSeoHealthStore } from "@/lib/seo-health/store";
import { fakeSite, html, ORIGIN, page, sitemap, xml } from "./fixtures";

/**
 * The crawler seeds itself from the route registry, so the fake site answers every core route
 * (with its own title and description, so duplicate checks stay quiet). Only `/gone`, linked
 * from the home page, is missing — one `http_error` and one `broken_link`.
 */
function site() {
  const good = (h1: string, links: string[]) =>
    html(
      200,
      page({
        title: `${h1} | Vedic Astrology & Vastu — Kavita`,
        description: `${h1}: book an integrated Vedic astrology and vastu consultation with Astrologer Kavita, online worldwide or in person.`,
        h1: [h1],
        links,
        words: 800,
      }),
    );
  const routes: Record<string, () => Response> = {
    "/": () => good("Home page", ["/about", "/gone"]),
    "/sitemap.xml": () => xml(sitemap([`${ORIGIN}/`, `${ORIGIN}/about`])),
  };
  for (const route of listIndexableCoreRoutes()) {
    routes[route.path] ??= () => good(`Page ${route.path}`, ["/"]);
  }
  // The fixture chrome links to /privacy; make sure it resolves even if the registry omits it.
  routes["/privacy"] ??= () => good("Privacy", ["/"]);
  return fakeSite(routes);
}

export async function runIntegration() {
  const { db, close } = await createTestDb();
  try {
    await seedTestContent(db);

    // --- crawl store + runner ---------------------------------------------------------------
    const store = new DbSeoHealthStore(db);
    let tick = 0;
    const first = await runSeoHealth({
      store,
      origin: ORIGIN,
      trigger: "manual",
      fetch: site().fetchFn,
      budgetMs: 1,
      now: () => (tick += 10),
    });
    equal(first.status, "paused", "first segment pauses under a tiny budget");
    const stored = await store.getCrawl(first.crawlId);
    check(stored?.status === "paused" && stored.state !== null, "paused crawl keeps its cursor");

    const second = await runSeoHealth({
      store,
      origin: ORIGIN,
      trigger: "cron",
      fetch: site().fetchFn,
      budgetMs: 20_000,
    });
    equal(second.crawlId, first.crawlId, "the paused crawl is resumed, not restarted");
    equal(second.status, "completed", "resumed crawl completes");
    check(second.resumed, "reported as resumed");
    const done = await store.getCrawl(first.crawlId);
    check(
      done?.status === "completed" && done.state === null && done.summary !== null,
      "completed crawl drops its cursor and stores a summary",
    );
    check((done?.summary?.bySeverity.error ?? 0) >= 1, "summary counts the broken link error");
    const counts = await store.countFindings(first.crawlId);
    check(
      (counts.byType.broken_link ?? 0) === 1 && (counts.byType.http_error ?? 0) === 1,
      `broken link + 404 stored (${JSON.stringify(counts.byType)})`,
    );
    const errors = await store.listFindings(first.crawlId, { severity: "error" });
    check(
      errors.rows.every((r) => r.severity === "error") && errors.total === counts.bySeverity.error,
      "severity filter",
    );
    const typed = await store.listFindings(first.crawlId, { type: "broken_link" });
    equal(typed.rows[0]?.fixHref, "/admin/redirects?prefill=%2Fgone", "fix link stored");
    const list = await store.listCrawls(5);
    equal(list.length, 1, "one crawl listed");
    check(list[0]?.state === null, "list projection omits the cursor");

    const fresh = await runSeoHealth({
      store,
      origin: ORIGIN,
      trigger: "manual",
      fresh: true,
      fetch: site().fetchFn,
      budgetMs: 20_000,
    });
    check(
      fresh.crawlId !== first.crawlId && fresh.status === "completed",
      "fresh crawl starts a new run",
    );

    // --- audit revert -----------------------------------------------------------------------
    const service = (await db.query.services.findFirst({
      where: eq(services.slug, "kundli-analysis"),
    }))!;
    const before = { ...service, priceNote: "old note", sortOrder: service.sortOrder };
    await db.update(services).set({ priceNote: "old note" }).where(eq(services.id, service.id));
    const after = { ...before, priceNote: "new note", name: "Renamed service" };
    await db
      .update(services)
      .set({ priceNote: "new note", name: "Renamed service" })
      .where(eq(services.id, service.id));
    const logged = await audit({
      adminUserId: null,
      action: "services.update",
      entityType: "services",
      entityId: service.id,
      before,
      after,
      db,
    });
    check(logged.ok, "audit row written");
    if (!logged.ok) return;

    const entry = (await db.query.adminAuditLog.findFirst({
      where: eq(adminAuditLog.id, logged.id),
    }))!;
    const chk = checkRevertable(entry);
    check(chk.ok && chk.mode === "update", "update entry is revertable");
    const lines = diffLines(entry.diff?.before, entry.diff?.after);
    check(
      lines[0]?.changed === true &&
        lines
          .filter((l) => l.changed)
          .map((l) => l.key)
          .sort()
          .join(",") === "name,priceNote",
      "diff lists changed keys first",
    );

    const reverted = await revertAuditEntry(db, logged.id, { adminUserId: null });
    check(
      reverted.ok && reverted.mode === "update",
      `revert applied (${JSON.stringify(reverted)})`,
    );
    const now = (await db.query.services.findFirst({ where: eq(services.id, service.id) }))!;
    equal(now.priceNote, "old note", "priceNote restored");
    equal(now.name, service.name, "name restored");
    check(now.updatedAt.getTime() >= service.updatedAt.getTime(), "updated_at bumped");
    const revertRow = await db.query.adminAuditLog.findFirst({
      where: eq(adminAuditLog.action, "services.revert"),
    });
    check(
      Boolean(revertRow) &&
        (revertRow?.diff?.after as { _revertOf?: string })?._revertOf === logged.id,
      "revert is itself audited with _revertOf",
    );

    // create → delete
    const [faq] = await db
      .insert(faqs)
      .values({ question: "Q?", answer: "A.", isPublished: true })
      .returning();
    const created = await audit({
      adminUserId: null,
      action: "faqs.create",
      entityType: "faqs",
      entityId: faq!.id,
      after: faq,
      db,
    });
    if (!created.ok) return;
    const del = await revertAuditEntry(db, created.id, { adminUserId: null });
    check(del.ok && del.mode === "delete", "create reverted by delete");
    equal(await db.query.faqs.findFirst({ where: eq(faqs.id, faq!.id) }), undefined, "faq removed");
    const again = await revertAuditEntry(db, created.id, { adminUserId: null });
    check(!again.ok && again.reason === "gone", "second revert of a create reports gone");

    // delete → insert
    const deleted = await audit({
      adminUserId: null,
      action: "faqs.delete",
      entityType: "faqs",
      entityId: faq!.id,
      before: faq,
      db,
    });
    if (!deleted.ok) return;
    const ins = await revertAuditEntry(db, deleted.id, { adminUserId: null });
    check(ins.ok && ins.mode === "insert", "delete reverted by insert");
    const restored = await db.query.faqs.findFirst({ where: eq(faqs.id, faq!.id) });
    check(
      restored?.question === "Q?" && restored.isPublished === true,
      "faq re-inserted with its id and fields",
    );

    // Redacted values never overwrite: site_settings with a redacted key keeps the current value.
    const settings = (await db.query.siteSettings.findFirst())!;
    const values = valuesToRestore(
      REVERTABLE_ENTITIES.site_settings!,
      { brandName: "Old brand", email: "[redacted]", createdAt: "2020-01-01T00:00:00.000Z" },
      settings as never,
    );
    equal(values.brandName, "Old brand", "plain value restored");
    equal(values.email, settings.email, "redacted value keeps the current one");
    check(!("createdAt" in values), "timestamps never written");
    const nested = restoreRedacted(
      { a: { token: "[redacted]", b: 1 } },
      { a: { token: "keep", b: 2 } },
    ) as { a: { token: string; b: number } };
    check(nested.a.token === "keep" && nested.a.b === 1, "nested redaction restored from current");

    // Not revertable cases
    check(
      !checkRevertable({
        entityType: "bookings",
        entityId: "x",
        diff: { before: {} },
        action: "bookings.confirm",
      }).ok,
      "bookings not revertable",
    );
    check(
      !checkRevertable({
        entityType: "services",
        entityId: null,
        diff: { before: {} },
        action: "x",
      }).ok,
      "no entity id",
    );
    check(
      !checkRevertable({
        entityType: "social_links",
        entityId: "x",
        diff: { before: [], after: [] },
        action: "social_links.reorder",
      }).ok,
      "bulk not revertable",
    );
    const missing = await revertAuditEntry(db, "00000000-0000-4000-8000-000000000000", {
      adminUserId: null,
    });
    check(!missing.ok && missing.reason === "not_found", "unknown entry");

    // Listing
    const page1 = await listAuditEntries(db, { entityType: "faqs", pageSize: 10 });
    check(
      page1.total >= 4 && page1.rows.every((r) => r.entityType === "faqs"),
      `entity filter (${page1.total})`,
    );
    const paged = await listAuditEntries(db, { page: 2, pageSize: 2 });
    equal(paged.rows.length, 2, "pagination");
  } finally {
    await close();
  }
}
