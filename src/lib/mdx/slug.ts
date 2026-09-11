/**
 * Heading slugs and table-of-contents extraction for MDX articles.
 *
 * `slugify` reproduces `github-slugger` (the slugger `rehype-slug` uses) for the headings this
 * site writes: lower-case, strip punctuation and symbols, spaces → hyphens, and number
 * duplicates `-1`, `-2`, … so the TOC links match the `id`s rehype-slug assigns at render time.
 * `github-slugger` itself is not hoisted by pnpm, so the tests assert the two agree instead.
 */

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** github-slugger's single-value form: keep letters, numbers, marks, `_`, `-` and spaces. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M} _-]/gu, "")
    .replace(/ /g, "-");
}

/** Stateful slugger: repeated headings get `-1`, `-2`… exactly as rehype-slug numbers them. */
export function createSlugger(): (value: string) => string {
  const seen = new Map<string, number>();
  return (value: string) => {
    const base = slugify(value);
    let result = base;
    while (seen.has(result)) {
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      result = `${base}-${n}`;
    }
    seen.set(result, seen.get(result) ?? 0);
    return result;
  };
}

/** Strip inline MDX/markdown from a heading so the slug and the TOC text match the rendered text. */
export function headingText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "") // JSX tags such as <Term slug="x">
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links and images
    .replace(/[*_`~]+/g, "") // emphasis and code
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `##` and `###` headings of an MDX body, in order, with the ids rehype-slug will assign. Code
 * fences are skipped so a `#` inside a code block is never mistaken for a heading.
 */
export function extractToc(body: string): TocItem[] {
  const out: TocItem[] = [];
  const slug = createSlugger();
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = headingText(match[2] ?? "");
    out.push({ id: slug(text), text, level: match[1]?.length === 2 ? 2 : 3 });
  }
  return out;
}
