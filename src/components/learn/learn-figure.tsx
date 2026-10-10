import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import type { ArticleMotif } from "@/content/article-categories";
import { cn } from "@/lib/utils";

/**
 * The width an instrument is drawn at: the hero sizes of `SceneHero` (64 · 36 · 22 rem),
 * `plate`, the single instrument above a plate's question (about 18 rem), and `cell`, one of
 * several instruments set in a row (about 11 rem).
 */
export type LearnFigureSize = "wide" | "half" | "small" | "plate" | "cell";

export interface LearnFigureProps {
  motif: ArticleMotif;
  /** Accessible name of the instrument; the figure is never decorative in a hero. */
  title: string;
  description?: string;
  /** The width it renders at — the stroke is scaled so every line stays a hairline. */
  size?: LearnFigureSize;
  /** Show the compass rose's Sanskrit direction names (compass only). */
  labels?: boolean;
  className?: string;
}

/**
 * Engraved, not painted (SPEC §1 rule 3): every line about one device pixel at its drawn size.
 * The charts and the compass share a 200-unit viewBox; the astronomical lines are 640 wide, so
 * the same pixel needs about three times the units.
 */
const STROKE: Record<"square" | "lines", Record<LearnFigureSize, number>> = {
  square: { wide: 0.3, half: 0.4, small: 0.6, plate: 0.7, cell: 1.1 },
  lines: { wide: 0.7, half: 1.1, small: 1.6, plate: 2.2, cell: 3.4 },
};

/** The aspect each instrument is drawn at — the astronomical lines are a wide plate. */
export function learnFigureRatio(motif: ArticleMotif): "1/1" | "16/9" {
  return motif === "lines" ? "16/9" : "1/1";
}

/** The closing disc's backdrop for a page whose instrument is the compass. */
export function learnCtaMotif(motif: ArticleMotif): "compass" | "south-chart" {
  return motif === "compass" ? "compass" : "south-chart";
}

/**
 * The one instrument of a Learn page's hero, drawn in gold hairlines and drawing itself once
 * (`data-draw` inherits down every stroke; at rest the figure is complete). The four motifs are
 * the ones the categories declare — a North Indian chart, a South Indian chart, the compass
 * rose and the astronomical lines — never an illustration.
 */
export function LearnFigure({
  motif,
  title,
  description,
  size = "small",
  labels = false,
  className,
}: LearnFigureProps) {
  const common = {
    title,
    description,
    strokeWidth: STROKE[motif === "lines" ? "lines" : "square"][size],
    "data-draw": "",
    className: cn("size-full text-accent-strong", className),
  } as const;
  switch (motif) {
    case "compass":
      return <VastuCompass {...common} hideLabels={!labels} />;
    case "north-chart":
      return <NorthIndianChart {...common} />;
    case "south-chart":
      return <SouthIndianChart {...common} />;
    case "lines":
      return <AstronomicalLines {...common} />;
  }
}

/**
 * Several instruments set side by side as one plate figure — the library's four sections, or
 * the chart beside the compass. Each sits in its own square cell (the astronomical lines are
 * centred in theirs), so the row keeps one explicit aspect and never shifts the layout.
 */
export function InstrumentRow({
  items,
  className,
}: {
  items: { motif: ArticleMotif; title: string; labels?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-2 gap-8 sm:gap-10",
        items.length === 4 && "max-w-[20rem] md:max-w-none md:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.motif} className="aspect-square">
          <LearnFigure
            motif={item.motif}
            title={item.title}
            size="cell"
            labels={item.labels ?? false}
          />
        </div>
      ))}
    </div>
  );
}
