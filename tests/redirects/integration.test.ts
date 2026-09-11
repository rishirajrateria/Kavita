/**
 * Against PGlite with the real migrations (Phase 6, P6-B): the redirect store (create, update,
 * loop refusal, duplicate refusal, chain collapse), the automatic 301 on a slug change, the
 * 404 log, sitemap configuration and the IndexNow log.
 */
import { eq } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import { indexnowLog, redirects } from "@/db/schema/redirects";
import { buildRedirectIndex, lookupInIndex } from "@/lib/redirects/cache";
import { toCsv } from "@/lib/redirects/csv";
import { submitIndexNowLogged } from "@/lib/redirects/indexnow-log";
import { listNotFound, markNotFoundResolved, upsertNotFound } from "@/lib/redirects/not-found-log";
import { recordSlugChange } from "@/lib/redirects/on-slug-change";
import {
  applyPageOverrides,
  getSitemapConfig,
  saveSitemapSection,
  setPageOverride,
} from "@/lib/redirects/sitemap-config";
import {
  createRedirect,
  importRedirects,
  listRedirects,
  redirectInputSchema,
  RedirectSaveError,
  toCsvRows,
  updateRedirect,
  type RedirectDb,
} from "@/lib/redirects/store";

function input(value: Record<string, unknown>) {
  const parsed = redirectInputSchema.safeParse(value);
  if (!parsed.success) throw new Error(`invalid test input: ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}

async function testStore(db: RedirectDb): Promise<void> {
  const created = await createRedirect(db, input({ fromPath: "/old-page/", toPath: "/new-page" }));
  equal(created.redirect.fromPath, "/old-page", "source is normalised on save");
  equal(created.redirect.statusCode, 301, "301 is the default status");
  equal(created.redirect.source, "manual", "manual is the default source");
  equal(created.redirect.hitCount, 0, "hit counter starts at zero");

  // Duplicate source.
  let duplicate: unknown;
  try {
    await createRedirect(db, input({ fromPath: "/old-page", toPath: "/elsewhere" }));
  } catch (error) {
    duplicate = error;
  }
  check(
    duplicate instanceof RedirectSaveError && duplicate.reason === "duplicate",
    "a second rule for the same source is refused",
  );

  // Direct loop.
  let loop: unknown;
  try {
    await createRedirect(db, input({ fromPath: "/loop", toPath: "/loop" }));
  } catch (error) {
    loop = error;
  }
  check(
    loop instanceof RedirectSaveError && loop.reason === "loop",
    "a rule that points at itself is refused",
  );

  // Indirect loop: /new-page → /old-page would close the cycle.
  let indirect: unknown;
  try {
    await createRedirect(db, input({ fromPath: "/new-page", toPath: "/old-page" }));
  } catch (error) {
    indirect = error;
  }
  check(
    indirect instanceof RedirectSaveError && indirect.reason === "loop",
    "a rule closing an existing chain into a cycle is refused",
  );

  // Chain collapse: /a → /old-page, whose destination is /new-page.
  const collapsed = await createRedirect(
    db,
    input({ fromPath: "/a", toPath: "/old-page", collapseChain: true }),
  );
  equal(collapsed.redirect.toPath, "/new-page", "collapse rewrites the chain to its final hop");
  const kept = await createRedirect(
    db,
    input({ fromPath: "/b", toPath: "/old-page", collapseChain: false }),
  );
  equal(kept.redirect.toPath, "/old-page", "without collapse the chain is kept and warned about");
  equal(kept.check.chain.length, 1, "the chain is reported back to the caller");

  // Update: change the destination and deactivate.
  const updated = await updateRedirect(
    db,
    kept.redirect.id,
    input({ fromPath: "/b", toPath: "/new-page", isActive: false, note: "tidied" }),
  );
  equal(updated.redirect.toPath, "/new-page", "update saves the new destination");
  equal(updated.redirect.isActive, false, "update can deactivate a rule");
  equal(updated.before.toPath, "/old-page", "update returns the previous row for the audit log");

  // 410 rules need no destination.
  const gone = await createRedirect(db, input({ fromPath: "/removed", statusCode: 410 }));
  equal(gone.redirect.toPath, null, "a 410 rule stores no destination");

  // Wildcard and regex rules survive the round trip and match through the cache.
  await createRedirect(
    db,
    input({ fromPath: "/blog/*", toPath: "/learn/$1", matchType: "wildcard" }),
  );
  const rows = await listRedirects(db);
  const index = buildRedirectIndex(
    rows
      .filter((r) => r.isActive)
      .map((r) => ({
        id: r.id,
        fromPath: r.fromPath,
        toPath: r.toPath,
        matchType: r.matchType,
        statusCode: r.statusCode,
      })),
  );
  equal(
    lookupInIndex(index, "/blog/kundli")?.destination,
    "/learn/kundli",
    "stored wildcard matches",
  );
  equal(lookupInIndex(index, "/b"), null, "a deactivated rule never matches");

  // CSV round trip through the database: export then re-import is a no-op plus new rows.
  const csv = toCsv(toCsvRows(rows));
  const result = await importRedirects(db, [
    ...toCsvRows(rows),
    { source: "/csv-new", destination: "/services", type: 302, note: "from CSV", match: "exact" },
  ]);
  equal(result.created, 1, "import creates only the genuinely new rule");
  check(result.updated >= 1, "import updates the rules that already existed");
  check(csv.includes("/removed,,410"), "the export writes a 410 row with an empty destination");
  const imported = (await listRedirects(db)).find((r) => r.fromPath === "/csv-new");
  equal(imported?.statusCode, 302, "imported status survives");
  equal(imported?.source, "import", "imported rules are marked as imports");
}

async function testSlugChange(db: RedirectDb): Promise<void> {
  // An older rule already points at the service's current URL; it must be collapsed forward.
  await createRedirect(db, input({ fromPath: "/services/old-name", toPath: "/services/kundli" }));

  const result = await recordSlugChange({
    entity: "services",
    oldPath: "/services/kundli",
    newPath: "/services/kundli-reading",
    adminUserId: null,
    db,
    submit: false,
  });
  check(result.redirectId !== null, "a slug change records a redirect");
  equal(result.unchanged, false, "a real change is not reported as unchanged");
  equal(result.collapsed, 1, "the rule pointing at the old URL is collapsed forward");

  const [rule] = await db
    .select()
    .from(redirects)
    .where(eq(redirects.fromPath, "/services/kundli"));
  equal(rule?.toPath, "/services/kundli-reading", "the 301 points at the new slug");
  equal(rule?.statusCode, 301, "a slug change is a 301, never a 302 (CLAUDE.md §5)");
  equal(rule?.source, "slug_change", "the rule is marked as automatic");
  check(rule?.note?.includes("services") ?? false, "the note names the entity");

  const [older] = await db
    .select()
    .from(redirects)
    .where(eq(redirects.fromPath, "/services/old-name"));
  equal(older?.toPath, "/services/kundli-reading", "the older rule now skips the middle hop");

  // Renaming back re-points the same row rather than creating a loop.
  const back = await recordSlugChange({
    entity: "services",
    oldPath: "/services/kundli-reading",
    newPath: "/services/kundli-analysis",
    adminUserId: null,
    db,
    submit: false,
  });
  check(back.redirectId !== null, "a second rename records its own redirect");
  const all = await listRedirects(db);
  equal(
    all.filter((r) => r.fromPath === "/services/kundli-reading").length,
    1,
    "one rule per source path",
  );

  // A no-op rename records nothing.
  const same = await recordSlugChange({
    entity: "services",
    oldPath: "/services/x",
    newPath: "/services/x/",
    adminUserId: null,
    db,
    submit: false,
  });
  equal(same.unchanged, true, "an unchanged slug records no redirect");
  equal(same.redirectId, null, "an unchanged slug creates no rule");
}

async function testNotFoundLog(db: RedirectDb): Promise<void> {
  await upsertNotFound("/missing-page", "https://www.google.com", db);
  await upsertNotFound("/missing-page", null, db);
  await upsertNotFound("/gone-for-good", null, db);
  // A path that a redirect already covers must show as handled.
  await createRedirect(db, input({ fromPath: "/gone-for-good", toPath: "/learn" }));

  const rows = await listNotFound(50, false, db);
  equal(rows.length, 2, "both paths are logged");
  const missing = rows.find((r) => r.path === "/missing-page");
  equal(missing?.hits, 2, "a repeat 404 increments the counter instead of inserting a row");
  equal(missing?.lastReferrer, "https://www.google.com", "the referrer origin is kept");
  equal(missing?.redirected, false, "an unfixed path is open");
  equal(
    rows.find((r) => r.path === "/gone-for-good")?.redirected,
    true,
    "a covered path is marked",
  );

  await markNotFoundResolved("/missing-page", db);
  const open = await listNotFound(50, false, db);
  equal(open.length, 1, "resolved rows drop out of the default list");
  equal((await listNotFound(50, true, db)).length, 2, "resolved rows are still available");
}

async function testSitemapConfig(db: RedirectDb): Promise<void> {
  const defaults = await getSitemapConfig(db);
  equal(defaults.pages.included, true, "every section is published by default");

  await saveSitemapSection(db, "images", { included: false });
  await setPageOverride(db, "pages", "/faq", { included: false });
  await setPageOverride(db, "pages", "/about", { priority: 0.9, changeFrequency: "weekly" });

  const config = await getSitemapConfig(db);
  equal(config.images.included, false, "a section can be excluded");
  equal(config.pages.perPage["/faq"]?.included, false, "a page can be excluded");
  equal(config.pages.perPage["/about"]?.priority, 0.9, "a priority override is stored");

  const entries = [
    { loc: "https://example.com/about", priority: 0.5, changefreq: "monthly" },
    { loc: "https://example.com/faq", priority: 0.5 },
    { loc: "https://example.com/contact", priority: 0.5 },
  ];
  const applied = applyPageOverrides(entries, config.pages);
  equal(applied.length, 2, "an excluded page is dropped from the urlset");
  equal(applied[0]?.priority, 0.9, "the priority override wins");
  equal(applied[0]?.changefreq, "weekly", "the change frequency override wins");
  equal(applyPageOverrides(entries, config.images).length, 0, "an excluded section renders empty");

  await setPageOverride(db, "pages", "/faq", null);
  equal(
    (await getSitemapConfig(db)).pages.perPage["/faq"],
    undefined,
    "clearing an override removes it",
  );
}

async function testIndexNowLog(db: RedirectDb): Promise<void> {
  // No INDEXNOW_KEY in the test environment: the submission is skipped, and that is logged too
  // so the owner can see why nothing was sent.
  let called = 0;
  const fetchImpl = (async () => {
    called += 1;
    return new Response("", { status: 200 });
  }) as unknown as typeof fetch;
  const result = await submitIndexNowLogged(["/about", "/contact"], "test", db, fetchImpl);
  equal(result.logStatus, "skipped", "without a key the submission is skipped");
  equal(called, 0, "no request is made without a key");

  const rows = await db.select().from(indexnowLog);
  equal(rows.length, 1, "the skipped submission is still logged");
  equal(rows[0]?.trigger, "test", "the trigger is recorded");
  equal(rows[0]?.urls.length, 2, "the URLs are recorded");
  equal(rows[0]?.status, "skipped", "the status is recorded honestly");
}

export async function run(): Promise<void> {
  const { db, close } = await createTestDb();
  try {
    await testStore(db);
    await testSlugChange(db);
    await testNotFoundLog(db);
    await testSitemapConfig(db);
    await testIndexNowLog(db);
  } finally {
    await close();
  }
}
