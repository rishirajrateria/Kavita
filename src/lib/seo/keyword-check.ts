/**
 * The §8 on-page checklist for one page (Phase 6 P6-A). Pure: it takes the rendered HTML and
 * the head summary already parsed by `head-preview.ts`, and answers the seven places the one
 * primary keyword must appear — title, H1, first 100 words, URL, one H2, an image alt and the
 * meta description — plus the length rules for the title and description.
 *
 * Matching is loose on purpose: case-insensitive, punctuation-insensitive, and a multi-word
 * keyword also passes when every word appears in the field ("astrologer in Mumbai" matches
 * "Astrologer in Mumbai — Vedic astrology & vastu"), because that is how an editor thinks.
 */
import { extractMainHtml, stripTags } from "./citability";
import type { HeadSummary } from "./head-preview";

export interface KeywordCheck {
  id:
    | "title"
    | "h1"
    | "first100"
    | "url"
    | "h2"
    | "imageAlt"
    | "metaDescription"
    | "titleLength"
    | "descriptionLength";
  label: string;
  ok: boolean;
  /** What was found, or what to do about it. */
  detail: string;
  /** A missing keyword in a place §8 requires is an error; the rest are warnings. */
  severity: "error" | "warning";
}

export interface KeywordChecklist {
  keyword: string | null;
  checks: KeywordCheck[];
  passed: number;
  total: number;
}

export const TITLE_MAX_CHARS = 60;
export const DESCRIPTION_MIN_CHARS = 150;
export const DESCRIPTION_MAX_CHARS = 160;

const normalise = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[‐-―]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** True when `haystack` contains the phrase, or every word of it. */
export function containsKeyword(haystack: string, keyword: string): boolean {
  const hay = normalise(haystack);
  const needle = normalise(keyword);
  if (!hay || !needle) return false;
  if (hay.includes(needle)) return true;
  // Fall back to "every meaningful word appears": short joining words (in, of, a) are ignored
  // so "astrologer in Mumbai" still matches "Astrologer in Mumbai, India".
  const words = needle.split(" ").filter((word) => word.length > 2);
  return words.length > 0 && words.every((word) => hay.includes(word));
}

function firstWords(text: string, count: number): string {
  return text.split(/\s+/).slice(0, count).join(" ");
}

/** Text of every `<hN>` at `level` inside `<main>`. */
function headingTexts(main: string, level: number): string[] {
  return [
    ...main.matchAll(new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}\\s*>`, "gi")),
  ].map((m) => stripTags(m[1] ?? ""));
}

function imageAlts(main: string): string[] {
  return [...main.matchAll(/<img\b[^>]*\balt="([^"]*)"/gi)].map((m) => m[1] ?? "");
}

/**
 * Run the checklist. `keyword` is `page_seo.keyword_focus`; with none set only the length
 * rules are returned, so the editor can still show something useful.
 */
export function keywordChecklist(input: {
  html: string;
  route: string;
  keyword: string | null | undefined;
  summary: Pick<HeadSummary, "title" | "description">;
}): KeywordChecklist {
  const { html, route, summary } = input;
  const keyword = input.keyword?.trim() ? input.keyword.trim() : null;
  const main = extractMainHtml(html);
  const text = stripTags(main);
  const title = summary.title ?? "";
  const description = summary.description ?? "";
  const checks: KeywordCheck[] = [];

  if (keyword) {
    const h1s = headingTexts(main, 1);
    const h2s = headingTexts(main, 2);
    const alts = imageAlts(main);
    const opening = firstWords(text, 100);
    const add = (
      id: KeywordCheck["id"],
      label: string,
      ok: boolean,
      detail: string,
      severity: KeywordCheck["severity"] = "error",
    ) => checks.push({ id, label, ok, detail, severity });

    add(
      "title",
      "Keyword in the title",
      containsKeyword(title, keyword),
      title ? `Title: “${title}”` : "No <title> found on the rendered page.",
    );
    add(
      "h1",
      "Keyword in the H1",
      h1s.some((h) => containsKeyword(h, keyword)),
      h1s.length === 0
        ? "No H1 found."
        : `H1: “${h1s[0]}”${h1s.length > 1 ? ` (+${h1s.length - 1} more — there must be exactly one)` : ""}`,
    );
    add(
      "first100",
      "Keyword in the first 100 words",
      containsKeyword(opening, keyword),
      opening ? `Opens: “${opening.slice(0, 120)}…”` : "No body text found.",
    );
    add(
      "url",
      "Keyword in the URL",
      containsKeyword(route.replace(/[/-]/g, " "), keyword),
      `URL: ${route}`,
      "warning",
    );
    add(
      "h2",
      "Keyword in at least one H2",
      h2s.some((h) => containsKeyword(h, keyword)),
      h2s.length === 0 ? "No H2s found." : `${h2s.length} H2s on the page.`,
    );
    add(
      "imageAlt",
      "Keyword in one image alt",
      alts.some((a) => containsKeyword(a, keyword)),
      alts.length === 0
        ? "No images with alt text in <main>."
        : `${alts.length} images with alt text.`,
      "warning",
    );
    add(
      "metaDescription",
      "Keyword in the meta description",
      containsKeyword(description, keyword),
      description ? `Description: “${description.slice(0, 120)}…”` : "No meta description found.",
    );
  }

  checks.push({
    id: "titleLength",
    label: `Title under ${TITLE_MAX_CHARS} characters`,
    ok: title.length > 0 && title.length <= TITLE_MAX_CHARS,
    detail: title ? `${title.length} characters.` : "No title.",
    severity: "warning",
  });
  checks.push({
    id: "descriptionLength",
    label: `Meta description ${DESCRIPTION_MIN_CHARS}–${DESCRIPTION_MAX_CHARS} characters`,
    ok: description.length >= DESCRIPTION_MIN_CHARS && description.length <= DESCRIPTION_MAX_CHARS,
    detail: description ? `${description.length} characters.` : "No meta description.",
    severity: "warning",
  });

  return {
    keyword,
    checks,
    passed: checks.filter((c) => c.ok).length,
    total: checks.length,
  };
}
