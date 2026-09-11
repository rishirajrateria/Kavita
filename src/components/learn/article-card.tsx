import Link from "next/link";
import { formatDisplayDate } from "@/components/content/byline";
import { Heading } from "@/components/ui/heading";
import type { Article } from "@/lib/articles";
import { cn } from "@/lib/utils";

/**
 * One article on a hub: category eyebrow, serif title (the whole card is the link), the
 * description, date and reading time. Plain server HTML; the hover is CSS only.
 */
export function ArticleCard({
  article,
  showCategory = true,
  className,
}: {
  article: Article;
  showCategory?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 border-t border-accent-border/50 py-6 transition-colors",
        className,
      )}
    >
      {showCategory ? (
        <p className="font-sans text-[0.68rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
          {article.categoryInfo.name}
        </p>
      ) : null}
      <Heading as="h3" level={4} className="text-xl leading-snug sm:text-2xl">
        <Link
          href={article.href}
          className="group-hover:text-accent-strong after:absolute after:inset-0 after:content-['']"
        >
          {article.title}
        </Link>
      </Heading>
      <p className="text-base leading-relaxed text-muted-foreground">{article.description}</p>
      <p className="mt-auto pt-1 text-sm text-muted-foreground">
        <time dateTime={article.dateModified}>{formatDisplayDate(article.dateModified)}</time>
        <span aria-hidden="true"> · </span>
        {article.readingMinutes} min read
      </p>
    </article>
  );
}

/** Responsive grid of article cards. */
export function ArticleGrid({
  articles,
  showCategory = true,
  columns = 2,
}: {
  articles: Article[];
  showCategory?: boolean;
  columns?: 2 | 3;
}) {
  if (articles.length === 0) return null;
  return (
    <div
      className={cn(
        "grid gap-x-10",
        columns === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2",
      )}
    >
      {articles.map((a) => (
        <ArticleCard key={a.slug} article={a} showCategory={showCategory} />
      ))}
    </div>
  );
}
