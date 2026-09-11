import Link from "next/link";
import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import { Heading } from "@/components/ui/heading";
import type { ArticleMotif } from "@/content/article-categories";
import type { ArticleCategoryWithCount } from "@/lib/articles";

function Motif({ motif }: { motif: ArticleMotif }) {
  switch (motif) {
    case "compass":
      return <VastuCompass decorative hideLabels description="" strokeWidth={0.9} />;
    case "north-chart":
      return <NorthIndianChart decorative strokeWidth={0.9} />;
    case "south-chart":
      return <SouthIndianChart decorative strokeWidth={0.9} />;
    case "lines":
      return <AstronomicalLines decorative strokeWidth={0.9} className="w-full" />;
  }
}

/** A Learn category with its quiet line-art motif, description and article count. */
export function CategoryCard({ category }: { category: ArticleCategoryWithCount }) {
  const count = category.count === 1 ? "1 article" : `${category.count} articles`;
  return (
    <article className="group relative flex gap-5 rounded-lg border border-accent-border/40 bg-surface-muted p-6 transition-colors hover:border-accent-border sm:p-7">
      <div
        aria-hidden="true"
        className="hidden size-16 shrink-0 text-accent-strong/70 group-hover:text-accent-strong sm:block"
      >
        <Motif motif={category.motif} />
      </div>
      <div className="min-w-0 space-y-2">
        <Heading as="h3" level={4} className="text-xl sm:text-2xl">
          <Link href={category.href} className="after:absolute after:inset-0 after:content-['']">
            {category.name}
          </Link>
        </Heading>
        <p className="text-base leading-relaxed text-muted-foreground">{category.description}</p>
        <p className="font-sans text-[0.68rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
          {count}
        </p>
      </div>
    </article>
  );
}
