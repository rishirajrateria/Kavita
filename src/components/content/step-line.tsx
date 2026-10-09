import type * as React from "react";
import { DashaTimeline, dashaSegmentFractions } from "@/components/motifs";
import { cn } from "@/lib/utils";
import { More } from "./more";

export interface StepLineProps {
  steps: { title: string; body?: string }[];
  /** Numbered (`<ol>`, default) or not. */
  ordered?: boolean;
  /** Summary of the fold holding the step bodies. */
  moreSummary?: string;
  className?: string;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/**
 * Steps on a ruled line (SPEC §2.3): the dasha rule divided equally, the titles under their
 * segments from 640 px and as a numbered ruled list below it — one `<ol>`, two layouts. The
 * bodies, when present, fold into one `More` as `<h3>` + paragraph. Titles are always visible.
 */
export function StepLine({
  steps,
  ordered = true,
  moreSummary = "The steps in full",
  className,
}: StepLineProps) {
  if (steps.length === 0) return null;
  const List: "ol" | "ul" = ordered ? "ol" : "ul";
  const fractions = dashaSegmentFractions(steps.map(() => 1));
  const hasBodies = steps.some((s) => s.body);

  return (
    <div className={cn("step-line", className)}>
      <div className="step-line-figure" aria-hidden="true">
        <DashaTimeline segments={steps.map(() => 1)} decorative className="text-accent-strong" />
      </div>
      <div className="step-line-rule h-px w-full bg-accent-border/40" aria-hidden="true" />
      <List className="step-line-list sm:mt-2">
        {steps.map((s, i) => (
          <li
            key={s.title}
            style={
              {
                "--w": (fractions[i]?.end ?? 0) - (fractions[i]?.start ?? 0),
              } as React.CSSProperties
            }
          >
            <span className="font-serif text-lg leading-none text-accent-strong" aria-hidden="true">
              {ROMAN[i] ?? String(i + 1)}
            </span>
            <span className="block font-display text-[0.68rem] leading-[1.6] font-semibold tracking-[0.18em] text-foreground uppercase sm:mt-2">
              {s.title}
            </span>
          </li>
        ))}
      </List>
      {hasBodies ? (
        <More summary={moreSummary} className="mt-8">
          <ol>
            {steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                {s.body ? <p className="mt-2">{s.body}</p> : null}
              </li>
            ))}
          </ol>
        </More>
      ) : null}
    </div>
  );
}
