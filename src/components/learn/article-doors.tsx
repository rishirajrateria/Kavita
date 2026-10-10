import { DoorField, formatDisplayDate, type Door } from "@/components/content";
import type { Article, ArticleCategoryWithCount } from "@/lib/articles";

/** One article as a door: its category's instrument, the title, the description, date and time. */
function articleDoor(article: Article, showCategory: boolean): Door {
  const when = `${formatDisplayDate(article.dateModified)} · ${article.readingMinutes} min read`;
  return {
    href: article.href,
    label: article.title,
    line: article.description,
    meta: showCategory ? `${article.categoryInfo.name} · ${when}` : when,
    motif: article.categoryInfo.motif,
  };
}

/**
 * The plate width a field of article doors wants: tiles take the default 52rem measure; one
 * or two station rows sit in the narrow 36rem one, so a lone guide never floats in a wide box.
 */
export function articleGridWidth(count: number): "narrow" | "default" {
  return count < 3 ? "narrow" : "default";
}

/**
 * Every list is a door (SPEC §2.3): the articles of a hub as a field of real links, each
 * carrying the glyph of its category, the title in Cinzel, the description visible beneath, and
 * the revision date and reading time as data-built meta. Three or more are a grid of tiles (one
 * column on a phone, where two would pinch the descriptions); one or two are ruled station rows
 * in a single column. Rendered in a plate's `figure` slot — the
 * picture the H2 and answer follow — so it fills the figure's measure. Plain server HTML; the
 * page renders the `MotifSprite` the glyphs reference.
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
