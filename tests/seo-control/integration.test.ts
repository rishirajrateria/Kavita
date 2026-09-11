/**
 * The SEO-control writes against PGlite with the real migrations (Phase 6 P6-A): page_seo
 * upserts and sanitisation, resolution by specificity, FAQ attachments, answer overrides and
 * the editable site documents.
 */
import { eq } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import { faqs, pageSeo, siteDocuments } from "@/db/schema";
import { pageSeoSchema } from "@/lib/seo/admin-schemas";
import {
  bulkAttach,
  deleteAttachment,
  listAttachments,
  updateAttachment,
} from "@/lib/seo/faq-attach";
import { deletePageAnswer, listPageAnswers, upsertPageAnswer } from "@/lib/seo/aeo-data";
import { getPageSeoByPattern, savePageSeo } from "@/lib/seo/page-seo-admin";
import { pickMostSpecific } from "@/lib/seo/route-pattern";
import { saveSiteDocument } from "@/lib/seo/documents";
import { patternMatches } from "@/lib/seo/route-pattern";

const parse = (input: Record<string, unknown>) => pageSeoSchema.parse(input);

export async function run() {
  const { db, close } = await createTestDb();
  try {
    // --- page_seo -----------------------------------------------------------------------------
    const created = await savePageSeo(
      db,
      parse({
        routePattern: "/astrologer/india/maharashtra/mumbai/",
        title: "Astrologer in Mumbai | Vedic Astrology & Vastu",
        metaDescription: "Kundli and vastu read together, online or in person in Mumbai.",
        robotsIndex: "on",
        robotsFollow: "on",
        maxSnippet: "120",
        maxImagePreview: "large",
        keywordFocus: "astrologer in Mumbai",
        hreflang: "en-IN https://example.com/a\nx-default https://example.com/b",
        customHeadHtml: '<meta name="ok" content="1"><script>alert(1)</script><div>no</div>',
      }),
    );
    equal(
      created.after?.routePattern,
      "/astrologer/india/maharashtra/mumbai",
      "the trailing slash is normalised away on save",
    );
    equal(created.before, null, "the first save has no before state");
    equal(created.after?.robots?.maxSnippet, 120, "robots form fields fold into the jsonb column");
    equal(created.after?.robots?.maxImagePreview, "large", "max image preview is stored");
    equal(created.after?.hreflang?.["x-default"], "https://example.com/b", "hreflang lines parse");
    check(
      created.after?.customHeadHtml?.includes('<meta name="ok"') === true,
      "the allowed meta survives the sanitiser",
    );
    check(
      !created.after?.customHeadHtml?.includes("alert("),
      "the script is stripped before it reaches the database",
    );
    check(created.warnings.length >= 2, "the sanitiser warnings come back for the admin");

    // Saving the same pattern again updates rather than duplicating.
    const updated = await savePageSeo(
      db,
      parse({ routePattern: "/astrologer/india/maharashtra/mumbai", title: "Second title" }),
    );
    equal(updated.before?.id, created.after?.id, "the second save reports the previous row");
    equal(updated.after?.id, created.after?.id, "the same row is updated");
    equal(
      (await db.select().from(pageSeo)).length,
      1,
      "one route pattern means one row (unique index)",
    );
    equal(updated.after?.title, "Second title", "the title was replaced");

    // noindex maps onto the legacy boolean columns as well as the jsonb.
    const noindexed = await savePageSeo(
      db,
      parse({ routePattern: "/share-your-experience", robotsIndex: "off" }),
    );
    equal(noindexed.after?.noindex, true, "robots index:false also sets the noindex column");

    // --- resolution ---------------------------------------------------------------------------
    for (const pattern of ["/astrologer/india/*", "/astrologer/*", "/*"]) {
      await savePageSeo(db, parse({ routePattern: pattern, title: `T ${pattern}` }));
    }
    const rows = await db.select().from(pageSeo);
    equal(
      pickMostSpecific(rows, "/astrologer/india/maharashtra/mumbai", (r) => r.routePattern)
        ?.routePattern,
      "/astrologer/india/maharashtra/mumbai",
      "the exact row wins over every glob",
    );
    equal(
      pickMostSpecific(rows, "/astrologer/india/kerala/kochi", (r) => r.routePattern)?.routePattern,
      "/astrologer/india/*",
      "the longest matching prefix wins",
    );
    equal(
      pickMostSpecific(rows, "/vastu-consultant/singapore", (r) => r.routePattern)?.routePattern,
      "/*",
      "the catch-all is the last resort",
    );
    equal(
      (await getPageSeoByPattern(db, "/astrologer/india/*"))?.title,
      "T /astrologer/india/*",
      "a glob row is fetched by its pattern",
    );

    // --- FAQ attachments ----------------------------------------------------------------------
    const inserted = await db
      .insert(faqs)
      .values([
        {
          question: "Do I need my exact birth time?",
          answer: "Yes — a".repeat(1),
          isPublished: true,
        },
        {
          question: "Can vastu be corrected without demolition?",
          answer: "Often",
          isPublished: true,
        },
        { question: "Draft question", answer: "Draft", isPublished: false },
      ])
      .returning();
    const ids = inserted.map((f) => f.id);
    const attached = await bulkAttach(db, {
      faqIds: [...ids, "00000000-0000-0000-0000-0000000000ff"],
      routePattern: "/astrologer/india/*",
      isPublished: true,
    });
    equal(attached.length, 3, "unknown FAQ ids are ignored, the real ones are attached");
    equal(attached[0]?.sortOrder, 0, "sort order starts at 0 and steps by 10");
    equal(attached[1]?.sortOrder, 10, "second attachment is ordered after the first");

    // Re-attaching the same pair updates instead of duplicating.
    const again = await bulkAttach(db, {
      faqIds: ids,
      routePattern: "/astrologer/india/*",
      isPublished: false,
    });
    equal(again.length, 3, "the same three rows come back");
    equal(
      (await listAttachments(db)).length,
      3,
      "re-attaching does not create duplicate attachment rows",
    );

    const first = (await listAttachments(db))[0];
    check(first !== undefined, "there is an attachment to update");
    if (first) {
      const changed = await updateAttachment(db, first.attachment.id, {
        sortOrder: 99,
        isPublished: true,
      });
      equal(changed.after?.sortOrder, 99, "the order is updated");
      equal(changed.before?.sortOrder, first.attachment.sortOrder, "before/after is returned");
      equal(
        (await updateAttachment(db, "00000000-0000-0000-0000-0000000000ff", { sortOrder: 1 }))
          .before,
        null,
        "updating a missing attachment reports nothing",
      );
      await deleteAttachment(db, first.attachment.id);
      equal((await listAttachments(db)).length, 2, "detaching removes the row");
    }

    // The published-only + pattern filter the public read applies.
    const visible = (await listAttachments(db)).filter(
      (a) =>
        a.attachment.isPublished &&
        a.faq.isPublished &&
        patternMatches(a.attachment.routePattern, "/astrologer/india/maharashtra/mumbai"),
    );
    equal(visible.length, 0, "unpublished attachments never reach a page");

    // --- answer overrides ---------------------------------------------------------------------
    const answer = await upsertPageAnswer(db, {
      route: "/astrologer/india/maharashtra/mumbai/",
      h2Id: "cost",
      answer: "Astrologer Kavita charges …",
    });
    equal(answer.after?.route, "/astrologer/india/maharashtra/mumbai", "the route is normalised");
    const withFacts = await upsertPageAnswer(db, {
      route: "/astrologer/india/maharashtra/mumbai",
      h2Id: "cost",
      keyFacts: [{ label: "Session length", value: "90 minutes" }],
    });
    equal(
      withFacts.after?.answer,
      "Astrologer Kavita charges …",
      "an upsert that only sets key facts keeps the existing answer",
    );
    equal(withFacts.after?.keyFacts?.[0]?.value, "90 minutes", "key facts are stored");
    equal((await listPageAnswers(db)).length, 1, "the same route+id is one row");
    await deletePageAnswer(db, withFacts.after?.id ?? "");
    equal((await listPageAnswers(db)).length, 0, "deleting removes the override");

    // --- site documents -----------------------------------------------------------------------
    await saveSiteDocument(db, "llms", { preamble: "First" }, null);
    const second = await saveSiteDocument(db, "llms", { preamble: "Second" }, null);
    equal(second.before?.config.preamble, "First", "the previous config is returned for the audit");
    equal(
      (await db.select().from(siteDocuments).where(eq(siteDocuments.key, "llms")))[0]?.config
        .preamble,
      "Second",
      "a document is upserted by key",
    );
    await saveSiteDocument(db, "og_templates", { geo: { title: "{{title}}" } }, null);
    equal((await db.select().from(siteDocuments)).length, 2, "documents are keyed independently");
  } finally {
    await close();
  }
}
