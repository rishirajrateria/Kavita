import type * as React from "react";
import { FigureSection } from "@/components/content";
import {
  DashaTimeline,
  PLANETS,
  VIMSHOTTARI_GRAHAS,
  VIMSHOTTARI_YEARS,
  dashaSegmentFractions,
} from "@/components/motifs";
import { TIMING } from "@/content/home";

const ACTIVE = 4;

/**
 * Plate II — "when, not only what": the thing that makes someone want to book.
 *
 * The Vimshottari dasha timeline is the picture — a rule ticked every ten years with a point of
 * light travelling its length — with the nine periods named in HTML beneath it (never inside
 * the SVG) and the running one marked; one ruled line and the answer are the words. No glass:
 * a figure is hairlines and air over the sky. On a phone the nine names fall into a 3 × 3 grid
 * rather than wrapping under the wrong segments.
 */
function DashaLabels() {
  const fractions = dashaSegmentFractions();
  return (
    <ol
      aria-label="The nine planetary periods and their lengths in years"
      className="mt-3 grid w-full grid-cols-3 gap-y-3 text-center sm:mt-1 sm:flex sm:gap-0"
    >
      {VIMSHOTTARI_GRAHAS.map((key, i) => {
        const f = fractions[i];
        const years = VIMSHOTTARI_YEARS[i];
        return (
          <li
            key={key}
            className="sm:min-w-0 sm:[flex:0_0_calc(var(--w)*100%)] sm:px-1"
            style={{ ["--w" as string]: f ? f.end - f.start : 0 } as React.CSSProperties}
          >
            <span
              className={
                i === ACTIVE
                  ? "block font-display text-[0.62rem] font-semibold tracking-[0.18em] text-accent-strong uppercase"
                  : "block font-display text-[0.62rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase"
              }
            >
              {PLANETS[key].name}
            </span>
            <span className="block font-serif text-sm leading-snug text-muted-foreground">
              {years} yrs
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Timing() {
  return (
    <FigureSection
      id={TIMING.id}
      route="/"
      n="II"
      tone="muted"
      question={TIMING.question}
      answer={TIMING.answer}
      figureWidth="default"
      line={TIMING.caption}
      figure={
        <div className="w-full">
          <DashaTimeline
            activeIndex={ACTIVE}
            tickEvery={10}
            travel
            className="text-accent-strong"
          />
          <DashaLabels />
        </div>
      }
    />
  );
}
