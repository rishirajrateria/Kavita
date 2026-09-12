import type * as React from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { BreadcrumbItem } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

export type PageHeroMotif = "compass" | "north-chart" | "south-chart" | "lines";

export interface PageHeroProps {
  /** Small-caps line above the H1, e.g. "About · Vedic astrologer and vastu consultant". */
  eyebrow: string;
  /** The page's only H1. */
  title: string;
  /** One-paragraph subhead under the H1 — in the HTML, never hidden. */
  lede: string;
  /** One large, low-opacity line-art motif off-canvas top-right (home/geo visual language). */
  motif?: PageHeroMotif;
  tone?: "ivory" | "indigo";
  /** Buttons/links rendered under the lede. */
  actions?: React.ReactNode;
  /** Breadcrumb trail excluding Home (rendered inside the hero, above the H1, with JSON-LD). */
  breadcrumbs?: BreadcrumbItem[];
  /** Small entity line under a gold hairline (e.g. who/where/what — §9.9). */
  entity?: React.ReactNode;
  /** Optional right-hand column (portrait figure, key list). */
  aside?: React.ReactNode;
  id?: string;
  className?: string;
}

const MOTIF_CLASS: Record<PageHeroMotif, string> = {
  compass:
    "pointer-events-none absolute top-[-26vw] right-[-40vw] w-[80vw] text-accent-strong/15 lg:top-[-16vw] lg:right-[-14vw] lg:w-[54vw]",
  "north-chart":
    "pointer-events-none absolute top-[-14vw] right-[-30vw] w-[70vw] rotate-6 text-accent-strong/15 lg:top-[-10vw] lg:right-[-10vw] lg:w-[46vw]",
  "south-chart":
    "pointer-events-none absolute top-[-12vw] right-[-28vw] w-[66vw] -rotate-3 text-accent-strong/15 lg:top-[-8vw] lg:right-[-8vw] lg:w-[42vw]",
  lines: "pointer-events-none absolute inset-x-0 -top-[6vw] text-accent-strong/16",
};

function Motif({ motif }: { motif: PageHeroMotif }) {
  switch (motif) {
    case "compass":
      return <VastuCompass decorative hideLabels description="" strokeWidth={0.75} />;
    case "north-chart":
      return <NorthIndianChart decorative strokeWidth={0.6} />;
    case "south-chart":
      return <SouthIndianChart decorative strokeWidth={0.6} />;
    case "lines":
      return <AstronomicalLines decorative strokeWidth={0.75} className="w-full" />;
  }
}

/**
 * Above the fold of a content page, in the home/geo language: breadcrumb trail, gold-hairline
 * eyebrow, the page's only H1, one lede, actions and an optional entity line — all plain HTML.
 * The motif is decorative backdrop linework, clipped by the section. Zero client JavaScript.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  motif = "compass",
  tone = "ivory",
  actions,
  breadcrumbs,
  entity,
  aside,
  id = "page-hero",
  className,
}: PageHeroProps) {
  const inverse = tone === "indigo";
  return (
    <Section
      as="header"
      spacing="none"
      tone={inverse ? "inverse" : "default"}
      className={cn(
        "overflow-hidden pt-4 pb-16 sm:pb-20 lg:pb-24",
        inverse && "grain border-b border-border",
        className,
      )}
      aria-labelledby={`${id}-title`}
    >
      <div aria-hidden="true" data-breathe className={MOTIF_CLASS[motif]}>
        <Motif motif={motif} />
      </div>

      <Container size="wide" className="relative">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-8 sm:mb-12" /> : null}

        <div
          className={cn(
            aside && "grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-10",
            !breadcrumbs && "pt-8 sm:pt-12",
          )}
        >
          <div className="max-w-[46rem]">
            <Heading
              as="h1"
              level="display"
              id={`${id}-title`}
              eyebrow={eyebrow}
              className="text-[clamp(2.4rem,1.4rem+3.6vw,4.4rem)] leading-[1.04] tracking-[-0.02em] text-balance"
            >
              {title}
            </Heading>

            <p className="mt-7 max-w-[38rem] text-lg leading-relaxed text-muted-foreground">
              {lede}
            </p>

            {actions ? (
              <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}

            {entity ? (
              <p className="mt-10 max-w-[38rem] border-t border-accent-border/40 pt-6 text-sm leading-relaxed text-muted-foreground">
                {entity}
              </p>
            ) : null}
          </div>

          {aside ? <div className="relative">{aside}</div> : null}
        </div>
      </Container>
    </Section>
  );
}
