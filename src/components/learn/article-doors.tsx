import { DoorField, formatDisplayDate, type Door } from "@/components/content";
import type { Article, ArticleCategoryWithCount } from "@/lib/articles";

const NBSP = "\u00a0";

/** Keep a short data segment on one line: `11 September 2026`, `12 min read`. */
const unbroken = (text: string) => text.replace(/ /g, NBSP);

/**
 * Door meta from data, joined so a narrow tile breaks only between segments: each `·` stays on
 * the line of the segment before it and the date and the reading time never split —
 * `VASTU BASICS · 11 SEPTEMBER 2026 ·` / `11 MIN READ`, never `11 /` `MIN READ`. The category
 * name may still wrap between its own words, so a long one never overflows a tile.
 */
function joinMeta(parts: string[]): string {
  return parts.join(`${NBSP}· `);
}

/** One article as a door: its category's instrument, the title, the description, date and time. */
function articleDoor(article: Article, showCategory: boolean): Door {
  const when = [
    unbroken(formatDisplayDate(article.dateModified)),
    unbroken(`${article.readingMinutes} min read`),
  ];
  return {
    href: article.href,
    label: article.title,
    line: article.description,
    meta: joinMeta(showCategory ? [article.categoryInfo.name, ...when] : when),
    motif: article.categoryInfo.motif,
  };
}

/**
 * Every list is a door (SPEC §2.3): the articles of a hub as a field of real links, each
 * carrying the glyph of its category, the title in Cinzel, the description visible beneath, and
 * the revision date and reading time as data-built meta. Three or more are a grid of tiles (one
 * column on a phone, where two would pinch the descriptions); one or two are ruled station rows
 * in a single column. Set under a plate's answer (`FigureSection` children) inside a
 * `DoorSpread`, so every "below" in the answer is true. Plain server HTML; the page renders the
 * `MotifSprite` the glyphs reference.
 */
export function ArticleGrid({
  articles,
  showCategory = true,
  columns = 3,
}: {
  articles: Article[];
  showCategory?: boolean;
  columns?: 2 | 3;
}) {
  if (articles.length === 0) return null;
  const doors = articles.map((a) => articleDoor(a, showCategory));
  if (articles.length < 3) {
    return (
      <DoorField doors={doors} columns={2} variant="station" className="w-full md:grid-cols-1!" />
    );
  }
  return (
    <DoorField
      doors={doors}
      columns={columns}
      variant="tile"
      className="w-full max-md:grid-cols-1!"
    />
  );
}

/** The four sections of the library as doors: instrument, name, description, article count. */
export function CategoryDoors({ categories }: { categories: ArticleCategoryWithCount[] }) {
  return (
    <DoorField
      columns={4}
      variant="tile"
      className="w-full max-md:grid-cols-1!"
      doors={categories.map((c) => ({
        href: c.href,
        label: c.name,
        line: c.description,
        meta: c.count === 1 ? "1 guide" : `${c.count} guides`,
        motif: c.motif,
      }))}
    />
  );
}
