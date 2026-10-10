import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import type { ArticleMotif } from "@/content/article-categories";

export interface LearnFigureProps {
  motif: ArticleMotif;
  /** Accessible name of the instrument; the figure is never decorative in a hero. */
  title: string;
  description?: string;
}

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
export function LearnFigure({ motif, title, description }: LearnFigureProps) {
  const common = {
    title,
    description,
    strokeWidth: 0.75,
    "data-draw": "",
    className: "size-full text-accent-strong",
  } as const;
  switch (motif) {
    case "compass":
      return <VastuCompass {...common} hideLabels />;
    case "north-chart":
      return <NorthIndianChart {...common} />;
    case "south-chart":
      return <SouthIndianChart {...common} />;
    case "lines":
      return <AstronomicalLines {...common} />;
  }
}
