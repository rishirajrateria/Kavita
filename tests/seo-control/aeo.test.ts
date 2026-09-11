/**
 * The answer-block linter, the citability scorer, the keyword checklist and the head parser
 * (Phase 6 P6-A) — all pure, run against fixture HTML.
 */
import { check, equal } from "../seo-plumbing/_assert";
import { ANSWER_MAX_WORDS, ANSWER_MIN_WORDS, isQuestionHeading, lintAnswer } from "@/lib/seo/aeo";
import { citabilityBand, scoreCitability } from "@/lib/seo/citability";
import { parseHead } from "@/lib/seo/head-preview";
import { containsKeyword, keywordChecklist } from "@/lib/seo/keyword-check";

const words = (n: number, seed = "word") =>
  Array.from({ length: n }, (_, i) => `${seed}${i}`).join(" ");

const GOOD_ANSWER =
  "A vastu consultation for a Dubai apartment with Astrologer Kavita reviews the floor plan " +
  "against the chart of the person living there, looks at entrance direction, kitchen and " +
  "bedroom placement, and returns remedies that suit a rented high-rise flat where walls " +
  "cannot be moved or rebuilt at all today.";

const GOOD_PAGE = `<html><head><title>T</title></head><body>
<header><nav>skip me</nav></header>
<main>
  <h1>Astrologer in Mumbai</h1>
  <dl><dt>Service</dt><dd>Astrology and vastu</dd></dl>
  <p>Astrologer Kavita reads charts and floor plans together for clients in Mumbai.</p>
  <h2 id="cost">How much does a consultation with an astrologer in Mumbai cost?</h2>
  <p class="answer">${GOOD_ANSWER}</p>
  <table><tr><td>Astrology</td><td>Vastu</td></tr></table>
  <p class="byline">Written by <a href="/about">Astrologer Kavita</a></p>
  <time datetime="2026-09-01">1 September 2026</time>
</main>
<script type="application/ld+json">{"@type":"FAQPage"}</script>
</body></html>`;

const THIN_PAGE = `<html><body><main>
  <h1>Mumbai</h1>
  <h2>Pricing</h2>
  <p>It depends.</p>
</main></body></html>`;

export function run() {
  // --- linter ---------------------------------------------------------------------------------
  const good = lintAnswer(GOOD_ANSWER);
  check(good.ok, `a well-formed answer passes (issues: ${JSON.stringify(good.issues)})`);
  check(
    good.wordCount >= ANSWER_MIN_WORDS && good.wordCount <= ANSWER_MAX_WORDS,
    `the fixture answer is ${good.wordCount} words, inside ${ANSWER_MIN_WORDS}–${ANSWER_MAX_WORDS}`,
  );

  const pronoun = lintAnswer(`It typically costs a little more than ${words(45)}`);
  check(
    pronoun.issues.some((i) => i.code === "leading_pronoun"),
    "a leading pronoun is an error",
  );
  check(!pronoun.ok, "a leading pronoun fails the lint");

  check(
    lintAnswer("Astrologer Kavita answers briefly.").issues.some((i) => i.code === "too_short"),
    "under 40 words is flagged",
  );
  check(
    lintAnswer(`Astrologer Kavita ${words(70)}`).issues.some((i) => i.code === "too_long"),
    "over 60 words is flagged",
  );
  check(
    lintAnswer(`Astrologer Kavita explains, as mentioned above, ${words(45)}`).issues.some(
      (i) => i.code === "undefined_reference",
    ),
    "a reference outside the answer is flagged",
  );
  check(
    lintAnswer(`The consultation covers ${words(45)}`).issues.some(
      (i) => i.code === "missing_subject",
    ),
    "not naming the subject is flagged",
  );
  check(
    lintAnswer(`Astrologer Kavita guarantees results for every client ${words(45)}`).issues.some(
      (i) => i.code === "outcome_promise",
    ),
    "an outcome promise is refused (CLAUDE.md §12)",
  );
  equal(lintAnswer("   ").issues[0]?.code, "empty", "an empty answer reports empty");
  check(isQuestionHeading("How much does it cost?"), "a question heading ends with ?");
  check(!isQuestionHeading("Pricing"), "a noun heading is not a question");

  // --- citability -----------------------------------------------------------------------------
  const strong = scoreCitability(GOOD_PAGE);
  check(strong.checks.keyFacts, "the definition list counts as key facts");
  check(strong.checks.questionH2s, "the question H2 is recognised");
  check(strong.checks.answersUnderH2s, "the answer paragraph under it is found");
  check(strong.checks.table, "the table is found");
  check(strong.checks.dated, "the <time> element counts as dated");
  check(strong.checks.byline, "the byline linking to /about is found");
  check(strong.checks.jsonLd, "JSON-LD is detected");
  equal(strong.score, 100, "a complete page scores 100");
  equal(citabilityBand(strong.score), "strong", "100 is a strong band");
  check(
    !scoreCitability(GOOD_PAGE).detail.wordCount.toString().startsWith("0"),
    "word count is measured",
  );

  const weak = scoreCitability(THIN_PAGE);
  check(weak.score < 50, `a thin page scores low (got ${weak.score})`);
  equal(citabilityBand(weak.score), "weak", "a low score is weak");
  check(weak.fixes.length >= 4, "a thin page gets several plain-language fixes");
  check(
    weak.fixes.some((f) => f.toLowerCase().includes("table")),
    "the missing table is named in the fixes",
  );
  // Header/footer chrome must not count towards the page.
  check(
    !scoreCitability(
      "<html><body><header><table></table></header><main><p>x</p></main></body></html>",
    ).checks.table,
    "a table in the header does not count",
  );

  // --- keyword checklist ----------------------------------------------------------------------
  check(
    containsKeyword("Astrologer in Mumbai — Vedic astrology", "astrologer in mumbai"),
    "phrase",
  );
  check(containsKeyword("Mumbai's best Vedic astrologer", "astrologer mumbai"), "all words match");
  check(!containsKeyword("Vastu consultant in Dubai", "astrologer in mumbai"), "no false positive");

  const list = keywordChecklist({
    html: GOOD_PAGE,
    route: "/astrologer/india/maharashtra/mumbai",
    keyword: "astrologer in Mumbai",
    summary: {
      title: "Astrologer in Mumbai | Vedic Astrology & Vastu",
      description: `Astrologer in Mumbai: ${words(20)}`,
    },
  });
  const by = (id: string) => list.checks.find((c) => c.id === id);
  check(by("title")?.ok === true, "keyword found in the title");
  check(by("h1")?.ok === true, "keyword found in the H1");
  check(by("url")?.ok === true, "keyword found in the URL");
  check(by("first100")?.ok === true, "keyword found in the opening copy");
  check(by("metaDescription")?.ok === true, "keyword found in the description");
  check(by("h2")?.ok === true, "keyword found in an H2");
  equal(
    keywordChecklist({
      html: GOOD_PAGE,
      route: "/about",
      keyword: null,
      summary: { title: "x", description: "y" },
    }).checks.length,
    2,
    "with no keyword only the two length rules are checked",
  );
  check(by("titleLength")?.ok === true, "a 48-character title is inside the 60-character guidance");

  // --- head parser ----------------------------------------------------------------------------
  const head = parseHead(`<html><head>
    <title>Astrologer in Mumbai</title>
    <meta name="description" content="Vedic astrology and vastu, read together.">
    <meta name="robots" content="index, follow">
    <meta property="og:image" content="https://example.com/og.png">
    <link rel="canonical" href="https://example.com/astrologer/india/maharashtra/mumbai">
    <link rel="alternate" hreflang="en-IN" href="https://example.com/astrologer/india">
    <script type="application/ld+json">{"@graph":[{"@type":"ProfessionalService"},{"@type":"FAQPage"}]}</script>
  </head><body><p>ignored</p></body></html>`);
  equal(head.summary.title, "Astrologer in Mumbai", "title parsed");
  equal(
    head.summary.description,
    "Vedic astrology and vastu, read together.",
    "description parsed",
  );
  equal(head.summary.robots, "index, follow", "robots parsed");
  equal(head.summary.ogImage, "https://example.com/og.png", "og:image parsed");
  check(head.summary.canonical?.endsWith("/mumbai") === true, "canonical parsed");
  equal(head.summary.hreflang["en-IN"], "https://example.com/astrologer/india", "hreflang parsed");
  equal(head.summary.jsonLdTypes.join(","), "ProfessionalService,FAQPage", "@graph types parsed");
  check(head.entries.length >= 7, "every head tag is listed");
}
