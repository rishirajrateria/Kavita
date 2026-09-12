import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * Convergence — the practice's whole argument as one drawing.
 *
 * On the left, a North Indian kundli with the fourth house shaded: the house the tradition reads
 * for home, property and domestic life. On the right, the plan of a home with its south-west room
 * shaded. Two lines carry both down into a single point, and below that point the two figures
 * have become one — a kundli diamond sitting on a plan's grid. One reading, one set of remedies.
 *
 * A visitor should be able to see the claim — *these are read together, not one after the other*
 * — before they read a word of the copy beside it.
 *
 * There is no text in the drawing. Every label belongs in the HTML around it, so the words stay
 * in the served markup at a real font size (CLAUDE.md §3, §9.1) instead of shrinking with the
 * figure on a phone.
 *
 * Motion: the chart draws, then the plan, then the two lines that join them, then the meeting
 * point breathes. Everything rests finished — `stroke-dashoffset: 0`, full opacity — so the
 * figure is complete before a frame runs and reduced-motion visitors get the finished drawing.
 */
export type ConvergenceProps = MotifProps;

/** `--draw-length` is set to each path's real length so the stroke draws over the whole 2.2s. */
function draw(delay: string, length: number): React.CSSProperties {
  return { "--draw-delay": delay, "--draw-length": length } as React.CSSProperties;
}

/**
 * `data-pulse` scales, and an SVG element's default transform reference box is the viewport, not
 * the shape — so without this a pulsing dot slides across the drawing instead of breathing in
 * place. `fill-box` pins the scale to the dot's own centre.
 */
const PULSE_IN_PLACE: React.CSSProperties = {
  fill: "var(--accent-strong)",
  stroke: "none",
  transformBox: "fill-box",
  transformOrigin: "center",
};

export function Convergence({
  title = "A birth chart and a floor plan read as one",
  description = "On the left a North Indian birth chart — a square with its diagonals and an inscribed diamond — with the fourth house shaded, the house read for home and property. On the right the plan of a home, north marked, with the south-west room shaded. Two lines run down from both drawings and meet at a single point, below which the two figures have become one small square: a chart's diamond drawn over a plan's grid.",
  decorative = false,
  strokeWidth = 1.5,
  className,
  ...rest
}: ConvergenceProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <svg
      viewBox="0 0 800 400"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
      className={cn("h-auto w-full overflow-visible", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...rest}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{description}</desc> : null}

      {/* ---- The chart: a person, and when things move for them ---------------------------- */}
      <g style={{ stroke: "var(--accent-strong)", opacity: 0.9 }}>
        <path
          d="M170 140 220 190 170 240 120 190Z"
          style={{ fill: "var(--accent-strong)", fillOpacity: 0.16, stroke: "none" }}
        />
        <rect data-draw x="70" y="40" width="200" height="200" style={draw("0.2s", 800)} />
        <path data-draw d="M70 40 270 240M270 40 70 240" style={draw("0.45s", 566)} />
        <path data-draw d="M170 40 270 140 170 240 70 140Z" style={draw("0.7s", 566)} />
      </g>
      <circle data-pulse cx="170" cy="190" r="4.5" style={PULSE_IN_PLACE} />

      {/* ---- The home: a place, and what in it helps or hinders --------------------------- */}
      <g style={{ stroke: "currentColor", opacity: 0.75 }}>
        <path
          data-draw
          d="M730 205 730 240 530 240 530 40 730 40 730 160"
          style={draw("0.6s", 755)}
        />
        <path data-draw d="M530 140H660M625 40V140M600 140V240" style={draw("0.85s", 330)} />
        <path data-draw d="M730 160 685 160A45 45 0 0 0 730 205" style={draw("1s", 120)} />
      </g>
      <g style={{ stroke: "var(--accent-strong)" }}>
        <rect
          x="530"
          y="140"
          width="70"
          height="100"
          style={{ fill: "var(--accent-strong)", fillOpacity: 0.13, strokeOpacity: 0.55 }}
        />
        {/* North, so the marked room reads as the south-west corner without a caption. */}
        <path d="M630 34V12" style={{ strokeOpacity: 0.7 }} />
        <path d="M623 18 630 4 637 18Z" style={{ fill: "var(--accent-strong)", stroke: "none" }} />
      </g>

      {/* ---- One reading ------------------------------------------------------------------ */}
      <g style={{ stroke: "var(--accent-strong)", opacity: 0.85 }}>
        <path data-draw d="M170 252C170 296 268 306 400 306" style={draw("1.15s", 265)} />
        <path data-draw d="M630 252C630 296 532 306 400 306" style={draw("1.3s", 265)} />
        <path data-draw d="M400 313V326" style={draw("1.6s", 13)} />
      </g>
      <path
        d="M390 326V386M410 326V386M370 346H430M370 366H430"
        style={{ stroke: "var(--mandala-strong)" }}
      />
      <g style={{ stroke: "var(--accent-strong)" }}>
        <rect data-draw x="370" y="326" width="60" height="60" style={draw("1.75s", 240)} />
        <path data-draw d="M400 326 430 356 400 386 370 356Z" style={draw("1.95s", 170)} />
      </g>
      <circle data-pulse cx="400" cy="306" r="5.5" style={PULSE_IN_PLACE} />
    </svg>
  );
}
