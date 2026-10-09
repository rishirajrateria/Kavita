import type * as React from "react";
import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import type { BreadcrumbItem } from "@/lib/seo/schema";
import { SceneHero } from "./scene-hero";

export type PageHeroMotif = "compass" | "north-chart" | "south-chart" | "lines";

export interface PageHeroProps {
  eyebrow: string;
  title: string;
  lede: string;
  motif?: PageHeroMotif;
  tone?: "ivory" | "indigo";
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  entity?: React.ReactNode;
  /** Rendered as the hero's figure when given (e.g. a portrait). */
  aside?: React.ReactNode;
  id?: string;
  className?: string;
}

function Motif({ motif }: { motif: PageHeroMotif }) {
  switch (motif) {
    case "compass":
      return <VastuCompass hideLabels strokeWidth={0.75} className="text-accent-strong" />;
    case "north-chart":
      return <NorthIndianChart strokeWidth={0.75} className="text-accent-strong" />;
    case "south-chart":
      return <SouthIndianChart strokeWidth={0.75} className="text-accent-strong" />;
    case "lines":
      return <AstronomicalLines strokeWidth={0.75} className="w-full text-accent-strong" />;
  }
}

/**
 * @deprecated Thin wrapper over `SceneHero` so pages not yet migrated still build: the eyebrow
 * becomes the tagline and the backdrop motif becomes a small figure. Replace with `SceneHero`
 * and delete this file once every page has moved (SPEC §5, Phase C).
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  motif = "compass",
  actions,
  breadcrumbs,
  entity,
  aside,
  id = "page-hero",
  className,
}: PageHeroProps) {
  return (
    <SceneHero
      id={id}
      className={className}
      title={title}
      tagline={eyebrow}
      lede={lede}
      figure={aside ?? <Motif motif={motif} />}
      figureSize="small"
      figureRatio={!aside && motif === "lines" ? "2/1" : "1/1"}
      breadcrumbs={breadcrumbs}
      entity={entity}
      actions={actions}
    />
  );
}
