import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * A life measured in planetary periods.
 *
 * The Vimshottari dasha system divides a span of 120 years into nine mahadashas of fixed,
 * unequal length; a reading places a person on that line and says which period is running. The
 * figure draws the line and its unequal divisions and nothing else — the reader sees at a glance
 * that the periods are of very different sizes, which is the point the prose then explains.
 *
 * The rule spans the full width of the viewBox, so a caller can position HTML labels over it at
 * `left: <fraction * 100>%` using `dashaSegmentFractions()`. No text is drawn inside the SVG.
 */

/** The nine mahadashas in their canonical order, in years. They total 120. */
export const VIMSHOTTARI_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17] as const;

export interface DashaSegmentFraction {
  /** Left edge as a fraction of the figure's width, 0–1. */
  readonly start: number;
  /** Right edge as a fraction of the figure's width, 0–1. */
  readonly end: number;
  /** Midpoint as a fraction of the figure's width, 0–1. */
  readonly mid: number;
}

/**
 * Where each segment sits across the figure, as 0–1 fractions of its width — so HTML labels laid
 * over `<DashaTimeline />` line up with the drawing without duplicating the arithmetic.
 */
export function dashaSegmentFractions(
  segments: readonly number[] = VIMSHOTTARI_YEARS,
): readonly DashaSegmentFraction[] {
  const usable = segments.filter((n) => Number.isFinite(n) && n > 0);
  const total = usable.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return [];
  let cursor = 0;
  return usable.map((n) => {
    const start = cursor / total;
    cursor += n;
    const end = cursor / total;
    return { start, end, mid: (start + end) / 2 };
  });
}

export interface DashaTimelineProps extends MotifProps {
  /**
   * Relative widths of the periods; normalised, so any units work. Defaults to the real
   * Vimshottari mahadasha lengths in years.
   */
  segments?: readonly number[];
  /**
   * Index of the period drawn as the one currently running. Omitted by default — the figure
   * asserts nothing about the reader until a caller says otherwise.
   */
  activeIndex?: number;
}

const WIDTH = 800;
const RULE_Y = 62;

export function DashaTimeline({
  title = "A life divided into planetary periods of unequal length",
  description = "A horizontal rule divided into nine segments of noticeably different widths, the way the Vimshottari dasha system divides one hundred and twenty years into nine planetary periods.",
  segments = VIMSHOTTARI_YEARS,
  activeIndex,
  decorative = false,
  strokeWidth = 1.25,
  className,
  ...rest
}: DashaTimelineProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;
  const fractions = dashaSegmentFractions(segments);
  const active = activeIndex === undefined ? undefined : fractions[activeIndex];

  return (
    <svg
      viewBox="0 0 800 120"
      fill="none"
      strokeLinecap="butt"
      style={{ strokeWidth }}
      className={cn("h-auto w-full overflow-visible", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...rest}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{description}</desc> : null}

      <g style={{ stroke: "currentColor", opacity: 0.4 }}>
        <path
          data-draw
          d={`M0 ${RULE_Y}H${WIDTH}`}
          style={{ "--draw-length": WIDTH } as React.CSSProperties}
        />
        <path d={`M1 30V94M${WIDTH - 1} 30V94`} />
      </g>

      {fractions.map((f, i) => {
        const x = f.start * WIDTH;
        const w = Math.max(f.end * WIDTH - x - 6, 1.5);
        return (
          <rect
            key={f.start}
            x={x + 3}
            y="46"
            width={w}
            height="32"
            rx="3"
            style={
              i === activeIndex
                ? {
                    fill: "var(--accent-strong)",
                    fillOpacity: 0.28,
                    stroke: "var(--accent-strong)",
                    strokeOpacity: 0.85,
                  }
                : {
                    fill: "var(--mandala)",
                    stroke: "var(--mandala-strong)",
                    strokeOpacity: 0.9,
                  }
            }
          />
        );
      })}

      {active ? (
        <g style={{ stroke: "var(--accent-strong)" }}>
          <path d={`M${active.mid * WIDTH} 80V102`} style={{ strokeOpacity: 0.7 }} />
          <circle
            data-pulse
            cx={active.mid * WIDTH}
            cy={RULE_Y}
            r="5"
            style={{
              fill: "var(--accent-strong)",
              stroke: "none",
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
        </g>
      ) : null}
    </svg>
  );
}
