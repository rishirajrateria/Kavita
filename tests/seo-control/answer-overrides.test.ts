/**
 * The public side of the AEO panel (Phase 6): an answer saved in `/admin/aeo` for a
 * `(route, h2_id)` pair actually reaches the page. Everything a page renders goes through
 * `readPageAnswers` → `answerMap`/`pickAnswer`/`mergeKeyFacts`, so those are exercised here
 * against PGlite with the real migrations, plus the no-database path the static build takes.
 */
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import {
  KEY_FACTS_ID,
  answerMap,
  getAnswerOverride,
  getKeyFactsOverride,
  getPageAnswers,
  mergeKeyFacts,
  pickAnswer,
  readPageAnswers,
  upsertPageAnswer,
} from "@/lib/seo/aeo-data";

const ROUTE = "/astrologer/india/maharashtra/mumbai";

const OVERRIDE =
  "Astrologer Kavita charges a single fee for the integrated Mumbai reading, covering the " +
  "kundli and the flat's vastu in one ninety-minute session with a written summary afterwards.";

const WRITTEN_IN_PAGE = "The answer written into the page itself.";

export async function run() {
  const { db, close } = await createTestDb();
  try {
    await upsertPageAnswer(db, { route: `${ROUTE}/`, h2Id: "opening", answer: OVERRIDE });
    await upsertPageAnswer(db, {
      route: ROUTE,
      h2Id: KEY_FACTS_ID,
      keyFacts: [
        { label: "Languages", value: "English, Hindi, Marathi" },
        { label: "Booking lead time", value: "About a week" },
      ],
    });
    await upsertPageAnswer(db, { route: ROUTE, h2Id: "blank", answer: "   " });

    // --- one batched read serves every block on the page ---------------------------------------
    const rows = await readPageAnswers(db, ROUTE);
    equal(Object.keys(rows).length, 3, "one read returns every override for the route");
    const overrides = answerMap(rows);
    equal(overrides["opening"], OVERRIDE, "the saved answer is keyed by its h2 id");
    check(!("blank" in overrides), "a blank answer row is not treated as an override");
    check(!(KEY_FACTS_ID in overrides), "the key-facts row is never used as an answer");

    // --- a matching (route, id) replaces the page's own copy ------------------------------------
    equal(
      pickAnswer(overrides, "opening", WRITTEN_IN_PAGE),
      OVERRIDE,
      "a matching route + h2 id replaces the default answer",
    );
    // --- a non-matching id falls through --------------------------------------------------------
    equal(
      pickAnswer(overrides, "tradition", WRITTEN_IN_PAGE),
      WRITTEN_IN_PAGE,
      "a non-matching h2 id keeps the answer written into the page",
    );
    equal(
      pickAnswer(overrides, undefined, WRITTEN_IN_PAGE),
      WRITTEN_IN_PAGE,
      "a block with no id keeps its own answer",
    );
    equal(
      pickAnswer(overrides, "blank", WRITTEN_IN_PAGE),
      WRITTEN_IN_PAGE,
      "an empty saved answer never blanks the page",
    );

    // --- a different route never sees another page's overrides ----------------------------------
    equal(
      Object.keys(await readPageAnswers(db, "/astrologer/india/maharashtra/pune")).length,
      0,
      "overrides are exact-route only",
    );

    // --- key facts: same label replaces in place, new labels append -----------------------------
    const own = [
      { label: "Service", value: "Astrologer in Mumbai" },
      { label: "Languages", value: "English" },
    ];
    const merged = mergeKeyFacts(own, rows[KEY_FACTS_ID]?.keyFacts ?? []);
    equal(merged.length, 3, "a new label is appended to the page's facts");
    equal(merged[0]?.label, "Service", "unmatched facts keep their order and value");
    equal(merged[0]?.value, "Astrologer in Mumbai", "unmatched facts are untouched");
    equal(merged[1]?.value, "English, Hindi, Marathi", "a matching label is replaced in place");
    equal(merged[2]?.label, "Booking lead time", "the extra fact is appended last");
    equal(mergeKeyFacts(own, [])[1]?.value, "English", "no override leaves the facts alone");
  } finally {
    await close();
  }

  // --- no database: a clean no-op, before any connection is attempted ---------------------------
  equal(Object.keys(await readPageAnswers(null, ROUTE)).length, 0, "no database reads nothing");
  equal(
    Object.keys(await getPageAnswers(ROUTE)).length,
    0,
    "the memoised page read is empty with no database configured",
  );
  equal(await getAnswerOverride(ROUTE, "opening"), null, "no database means no answer override");
  equal((await getKeyFactsOverride(ROUTE)).length, 0, "no database means no key-facts override");
  equal(
    pickAnswer(answerMap(await getPageAnswers(ROUTE)), "opening", WRITTEN_IN_PAGE),
    WRITTEN_IN_PAGE,
    "with no database every block renders the answer written into the page",
  );
}
