/**
 * Citability scoring for a rendered page (CLAUDE.md §9; Phase 6 P6-A). Pure — takes HTML,
 * returns a 0–100 score with the individual checks and plain-language fixes. Imported by the
 * SEO editor, the SEO list and P6-D's health crawler, so the signature is fixed:
 *
 *   scoreCitability(html): { score, checks: {…}, fixes: string[] }
 *
 * The page is reduced to `<main>` with chrome and scripts removed — the same reduction the
 * markdown mirror applies — so header/footer content never counts.
 */

export interface CitabilityChecks {
  /** A compact definition list of facts near the top (`<dl>` in the first third of `<main>`). */
  keyFacts: boolean;
  /** At least one H2 phrased as a question, and most H2s are. */
  questionH2s: boolean;
  /** Every question H2 is followed by a `<p class="answer">` before the next heading. */
  answersUnderH2s: boolean;
  /** At least one `<table>`. */
  table: boolean;
  /** A `<time datetime>` or a visible Published/Updated date. */
  dated: boolean;
  /** An author byline linking to `/about`. */
  byline: boolean;
  /** JSON-LD present (bonus; not part of the six brief checks but cheap to surface). */
  jsonLd: boolean;
}

export interface CitabilityResult {
  score: number;
  checks: CitabilityChecks;
  fixes: string[];
  /** Counts behind the checks, for the editor's detail view. */
  detail: {
    h2Count: number;
    questionH2Count: number;
    answeredH2Count: number;
    tableCount: number;
    wordCount: number;
  };
}

const WEIGHTS: Record<keyof CitabilityChecks, number> = {
  keyFacts: 20,
  questionH2s: 20,
  answersUnderH2s: 20,
  table: 15,
  dated: 10,
  byline: 15,
  jsonLd: 0,
};

const STRIP_RE =
  /<(script|style|noscript|template|svg|header|footer|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/** `<main>` (or `<body>`, or everything) with scripts, styles and chrome removed. */
export function extractMainHtml(html: string): string {
  const main = /<main\b[^>]*>([\s\S]*?)<\/main\s*>/i.exec(html);
  const body = main?.[1] ?? /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(html)?.[1] ?? html;
  return body.replace(STRIP_RE, "").replace(/<!--[\s\S]*?-->/g, "");
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface HeadingHit {
  level: number;
  text: string;
  /** Character offset just after the closing tag. */
  end: number;
  start: number;
}

function headings(main: string): HeadingHit[] {
  const out: HeadingHit[] = [];
  for (const m of main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)) {
    const inner = (m[2] ?? "").replace(/<[^>]*data-slot="eyebrow"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");
    out.push({
      level: Number(m[1]),
      text: stripTags(inner),
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
    });
  }
  return out;
}

const ANSWER_P_RE = /<p\b[^>]*\bclass="[^"]*\banswer\b[^"]*"[^>]*>/i;
const NEXT_HEADING_RE = /<h[1-6]\b/i;

/** Score the HTML of one rendered page. */
export function scoreCitability(html: string): CitabilityResult {
  const main = extractMainHtml(html);
  const text = stripTags(main);
  const hs = headings(main);
  const h2s = hs.filter((h) => h.level === 2);
  const questionH2s = h2s.filter((h) => /\?\s*$/.test(h.text));

  let answered = 0;
  for (const h of questionH2s) {
    const after = main.slice(h.end);
    const nextHeading = NEXT_HEADING_RE.exec(after);
    const window = nextHeading ? after.slice(0, nextHeading.index) : after;
    if (ANSWER_P_RE.test(window)) answered += 1;
  }

  const firstThird = main.slice(0, Math.max(2000, Math.floor(main.length / 3)));
  const keyFacts = /<dl\b/i.test(firstThird) || /\bkey facts\b/i.test(stripTags(firstThird));
  const tableCount = (main.match(/<table\b/gi) ?? []).length;
  const dated =
    /<time\b[^>]*\bdatetime=/i.test(main) ||
    /\b(published|updated|last reviewed|reviewed)\b[^.]{0,40}\b(19|20)\d{2}\b/i.test(text);
  const byline =
    /<[^>]+\bclass="[^"]*\bbyline\b[^"]*"[^>]*>[\s\S]*?href="[^"]*\/about[^"]*"/i.test(main) ||
    /rel="author"/i.test(main) ||
    /\bby\s+<a\b[^>]*href="[^"]*\/about/i.test(main);
  const jsonLd = /application\/ld\+json/i.test(html);

  const checks: CitabilityChecks = {
    keyFacts,
    questionH2s: questionH2s.length > 0 && questionH2s.length * 2 >= h2s.length,
    answersUnderH2s: questionH2s.length > 0 && answered === questionH2s.length,
    table: tableCount > 0,
    dated,
    byline,
    jsonLd,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS) as [keyof CitabilityChecks, number][]) {
    if (checks[key]) score += weight;
  }

  const fixes: string[] = [];
  if (!checks.keyFacts) {
    fixes.push(
      "Add a key-facts block near the top (a definition list: service, practitioner, area served, modes, languages, session length, timezone window, response time) — AEO panel → Key facts.",
    );
  }
  if (!checks.questionH2s) {
    fixes.push(
      h2s.length === 0
        ? "The page has no H2s. Structure the body with H2s phrased as the questions people ask."
        : `Only ${questionH2s.length} of ${h2s.length} H2s are phrased as questions. Rewrite H2s as real questions ending in "?".`,
    );
  }
  if (!checks.answersUnderH2s) {
    fixes.push(
      questionH2s.length === 0
        ? 'Put a 40–60 word self-contained answer in <p class="answer"> directly under each question H2.'
        : `${questionH2s.length - answered} question H2${questionH2s.length - answered === 1 ? " has" : "s have"} no <p class="answer"> directly beneath — add one in the AEO panel → Answer blocks.`,
    );
  }
  if (!checks.table) {
    fixes.push(
      "Add at least one comparison or specification table (astrology vs vastu, what to prepare, consultation types) — tables extract extremely well.",
    );
  }
  if (!checks.dated) {
    fixes.push("Show a visible Published / Updated date in a <time datetime> element.");
  }
  if (!checks.byline) {
    fixes.push("Add the author byline with credentials linking to /about (E-E-A-T).");
  }
  if (!checks.jsonLd)
    fixes.push("No JSON-LD found; every page should carry BreadcrumbList at least.");

  return {
    score,
    checks,
    fixes,
    detail: {
      h2Count: h2s.length,
      questionH2Count: questionH2s.length,
      answeredH2Count: answered,
      tableCount,
      wordCount: text ? text.split(/\s+/).length : 0,
    },
  };
}

/** Label for a score band, shared by the list and the editor. */
export function citabilityBand(score: number): "strong" | "fair" | "weak" {
  if (score >= 80) return "strong";
  if (score >= 50) return "fair";
  return "weak";
}
