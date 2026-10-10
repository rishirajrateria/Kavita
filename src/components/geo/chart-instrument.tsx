import type * as React from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

const C = 200;
/** The chart square inscribed in the inner ring: 82 → 318 on both axes. */
const A = 82;
const B = 318;
const M = C;
const SQUARE = `M${A} ${A}H${B}V${B}H${A}Z`;
const DIAGONALS = `M${A} ${A}L${B} ${B}M${B} ${A}L${A} ${B}`;
const DIAMOND = `M${M} ${A}L${B} ${M}L${M} ${B}L${A} ${M}Z`;

/** Seventy-two ticks around the rim, every 30° (one sign) longer. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const major = i % 6 === 0;
  const rad = ((i * 5 - 90) * Math.PI) / 180;
  const r1 = 190;
  const r2 = major ? 180 : 185;
  const p = (r: number) =>
    `${(C + r * Math.cos(rad)).toFixed(2)} ${(C + r * Math.sin(rad)).toFixed(2)}`;
  return `M${p(r1)}L${p(r2)}`;
}).join("");

function draw(delay: string, length: number): React.CSSProperties {
  return { "--draw-delay": delay, "--draw-length": length } as React.CSSProperties;
}

/**
 * The hero instrument of an astrologer geo page: the North Indian chart — twelve fixed houses
 * from a square, its diagonals and the inscribed diamond — set inside a ring ticked every five
 * degrees (every sign marked longer) that turns once in ten minutes. The chart draws itself,
 * then light flows along its frame and diamond for good, a point travels the square and the
 * centre breathes; transform, opacity and dash offset only, all CSS (globals.css hooks).
 * No text inside the SVG; the accessible name is the chart layout's own.
 */
export function ChartInstrument({ className }: { className?: string }) {
  const id = useId();
  const titleId = `${id}-title`;
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-labelledby={titleId}
      className={cn("size-full overflow-visible", className)}
    >
      <title id={titleId}>North Indian birth chart layout</title>

      <circle
        data-draw
        cx={C}
        cy={C}
        r={190}
        style={{
          stroke: "currentColor",
          strokeOpacity: 0.55,
          strokeWidth: 0.75,
          ...draw("0s", 1200),
        }}
      />
      <g
        data-turn
        style={
          {
            "--turn-duration": "600s",
            transformBox: "view-box",
            transformOrigin: `${C}px ${C}px`,
          } as React.CSSProperties
        }
      >
        <path d={TICKS} style={{ stroke: "currentColor", strokeOpacity: 0.5, strokeWidth: 0.6 }} />
      </g>
      <circle
        cx={C}
        cy={C}
        r={170}
        strokeDasharray="1 5"
        style={{ stroke: "currentColor", strokeOpacity: 0.35, strokeWidth: 0.75 }}
      />

      <g style={{ stroke: "currentColor", strokeWidth: 0.9 }}>
        <path data-draw d={SQUARE} style={draw("0.15s", 944)} />
        <path data-draw d={DIAGONALS} style={{ strokeOpacity: 0.8, ...draw("0.55s", 668) }} />
        <path data-draw d={DIAMOND} style={draw("0.95s", 668)} />
      </g>

      {/* Light travelling the lines once the chart has drawn. */}
      <g
        aria-hidden="true"
        style={{ stroke: "var(--display-title)", strokeWidth: 1.6, opacity: 0.6 }}
      >
        <path data-flow d={SQUARE} style={{ ["--flow-duration" as string]: "26s" }} />
        <path data-flow d={DIAMOND} style={{ ["--flow-duration" as string]: "19s" }} />
      </g>
      <g
        data-travel
        aria-hidden="true"
        className="motion-reduce:hidden"
        style={
          {
            "--travel-path": `path("${SQUARE}")`,
            "--travel-duration": "42s",
          } as React.CSSProperties
        }
      >
        <circle r={7} style={{ fill: "var(--glow)" }} />
        <circle r={2.6} style={{ fill: "var(--display-title)" }} />
      </g>
      <circle data-pulse cx={C} cy={C} r={3} style={{ fill: "currentColor" }} />
    </svg>
  );
}
