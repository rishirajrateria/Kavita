import type * as React from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EarthHorizon } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import type { BreadcrumbItem } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";
import { Rule } from "./rule";

export interface SceneHeroProps {
  /** The page's only H1. Cinzel up to 28 characters, Cormorant beyond (or `titleFont`). */
  title: string;
  /** The ruled Cinzel line under the H1. */
  tagline: string;
  /** One paragraph under the figure — in the HTML, always visible. */
  lede: string;
  /** The one large instrument of the page. */
  figure: React.ReactNode;
  /** 64 · 36 · 22 rem. */
  figureSize?: "wide" | "half" | "small";
  figureRatio: "3/2" | "1/1" | "2/1" | "16/9";
  /** Trail excluding Home (rendered above the H1, with JSON-LD). */
  breadcrumbs?: BreadcrumbItem[];
  /** Entity sentence under a hairline (CLAUDE.md §9.9). */
  entity?: React.ReactNode;
  /** The only place a `Disc size="sm"` or a gold button may appear above the fold. */
  actions?: React.ReactNode;
  /** Three quiet words under everything, as on the home hero. */
  words?: readonly string[];
  titleFont?: "display" | "serif";
  /** Draw the Earth's lit horizon across the bottom-left (geo country pages). */
  earth?: boolean;
  id?: string;
  className?: string;
}

const SIZE: Record<NonNullable<SceneHeroProps["figureSize"]>, string> = {
  wide: "64rem",
  half: "36rem",
  small: "22rem",
};

const RATIO: Record<SceneHeroProps["figureRatio"], number> = {
  "3/2": 1.5,
  "1/1": 1,
  "2/1": 2,
  "16/9": 16 / 9,
};

/**
 * The opening scene of every public page (SPEC §2.3), in the home hero's language: a centred
 * H1, a ruled tagline, one large instrument drawn in gold hairlines on the night, then the
 * lede, the actions and the entity line. All plain HTML; the H1 never animates.
 */
export function SceneHero({
  title,
  tagline,
  lede,
  figure,
  figureSize = "wide",
  figureRatio,
  breadcrumbs,
  entity,
  actions,
  words,
  titleFont,
  earth = false,
  id = "page-hero",
  className,
}: SceneHeroProps) {
  const serif = (titleFont ?? (title.length > 28 ? "serif" : "display")) === "serif";

  return (
    <header
      id={id}
      className={cn("scene-hero relative isolate overflow-hidden pt-4 pb-12 lg:pb-16", className)}
      aria-labelledby={`${id}-title`}
    >
      {/* The Milky Way's dust, crossing the right of the scene — as the home hero, at half. */}
      <div
        aria-hidden="true"
        data-aurora="c"
        className="pointer-events-none absolute -top-[30%] -right-[18%] h-[170%] w-[58%] -rotate-[32deg] opacity-50 blur-3xl"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--violet-300) 10%, transparent) 42%, color-mix(in srgb, var(--bone-100) 9%, transparent) 56%, transparent 100%)",
        }}
      />
      {earth ? <EarthHorizon /> : null}

      <Container size="wide" className="relative">
        {breadcrumbs ? (
          <Breadcrumbs
            items={breadcrumbs}
            className="mb-4 overflow-x-auto font-sans text-[0.8rem] whitespace-nowrap text-muted-foreground sm:mb-6"
          />
        ) : null}

        <div className={cn("text-center", !breadcrumbs && "pt-6 sm:pt-8")}>
          <h1
            id={`${id}-title`}
            className={
              serif
                ? "mx-auto max-w-[20ch] font-serif text-[clamp(2.2rem,1.4rem+3vw,4rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance text-foreground"
                : "font-display text-[clamp(2.1rem,1.2rem+4.2vw,4.4rem)] leading-none font-medium tracking-[0.14em] text-display-title uppercase"
            }
          >
            {title}
          </h1>
          <Rule tone="accent" className="mx-auto mt-5 max-w-[44rem] justify-center">
            {tagline}
          </Rule>
        </div>

        <figure
          data-parallax
          className="scene-figure relative mx-auto mt-8 flex w-full items-center justify-center"
          style={
            {
              "--figure-size": SIZE[figureSize],
              "--figure-ratio": RATIO[figureRatio],
              "--parallax-depth": "18px",
            } as React.CSSProperties
          }
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[150%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, var(--glow), transparent 70%)" }}
          />
          <div className="relative size-full">{figure}</div>
        </figure>

        <p className="lede mx-auto mt-8 max-w-[44rem] text-center font-serif text-[1.15rem] leading-[1.55] text-muted-foreground">
          {lede}
        </p>

        {actions ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
            {actions}
          </div>
        ) : null}

        {entity ? (
          <p className="entity mx-auto mt-6 max-w-[38rem] border-t border-accent-border/40 pt-5 text-left font-sans text-[0.85rem] leading-relaxed text-muted-foreground sm:text-center">
            {entity}
          </p>
        ) : null}

        {words ? (
          <p className="mt-8 text-center font-display text-[0.62rem] font-semibold tracking-[0.36em] text-muted-foreground uppercase">
            {words.join("  ·  ")}
          </p>
        ) : null}
      </Container>
    </header>
  );
}
