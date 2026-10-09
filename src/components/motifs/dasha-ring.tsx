import { useId } from "react";
import { cn } from "@/lib/utils";
import { VIMSHOTTARI_GRAHAS, VIMSHOTTARI_YEARS } from "./dasha-timeline";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * The Vimshottari cycle as a wheel: one hundred and twenty years around a ring.
 *
 * Nine arcs, each as long as its planetary period (7, 20, 6, 10, 7, 18, 16, 19, 17 years), with
 * the graha of each period standing at its arc's midpoint in the canonical order — Ketu, Venus,
 * Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury — starting at the top and running clockwise.
 * The arcs draw themselves in sequence, and a single point goes once around in 120 seconds: a
 * second a year. An inner ring with twelve ticks keeps it an instrument rather than a pie.
 *
 * No text inside the SVG; the names and years are an HTML row beneath. The planets are the
 * site's own animated drawings in `public/planets/`, never more than 40 units across.
 */
export type DashaRingProps = MotifProps;

const CX = 200;
const CY = 200;
const R_RING = 150;
const R_INNER = 112;
const GAP_DEG = 2;
const PLANET = 40;
const TOTAL = VIMSHOTTARI_YEARS.reduce<number>((sum, n) => sum + n, 0);

function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [Number((CX + r * Math.cos(rad)).toFixed(2)), Number((CY + r * Math.sin(rad)).toFixed(2))];
}

interface Arc {
  d: string;
  length: number;
  mid: [number, number];
}

const ARCS: readonly Arc[] = (() => {
  let cursor = -90;
  return VIMSHOTTARI_YEARS.map((years) => {
    const span = (years / TOTAL) * 360;
    const from = cursor + GAP_DEG / 2;
    const to = cursor + span - GAP_DEG / 2;
    cursor += span;
    const [ax, ay] = polar(R_RING, from);
    const [bx, by] = polar(R_RING, to);
    return {
      d: `M${ax} ${ay}A${R_RING} ${R_RING} 0 ${to - from > 180 ? 1 : 0} 1 ${bx} ${by}`,
      length: Math.ceil((R_RING * (to - from) * Math.PI) / 180),
      mid: polar(R_RING, (from + to) / 2),
    };
  });
})();

const INNER_TICKS = Array.from({ length: 12 }, (_, i) => {
  const deg = i * 30 - 90;
  const [x1, y1] = polar(R_INNER, deg);
  const [x2, y2] = polar(R_INNER - 6, deg);
  return `M${x1} ${y1} ${x2} ${y2}`;
}).join("");

export function DashaRing({
  title = "The Vimshottari dasha cycle of one hundred and twenty years",
  description = "A ring divided into nine arcs of unequal length, one for each planetary period of the Vimshottari dasha system, with the planet of each period drawn at the middle of its arc: Ketu, Venus, the Sun, the Moon, Mars, Rahu, Jupiter, Saturn and Mercury, running clockwise from the top.",
  decorative = false,
  strokeWidth = 1.25,
  className,
  ...rest
}: DashaRingProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      strokeLinecap="round"
      style={{ strokeWidth }}
      className={cn("h-auto w-full overflow-visible", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...rest}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{description}</desc> : null}

      {/* The inner ring: twelve ticks, as on any wheel of the tradition. */}
      <g style={{ stroke: "var(--mandala-strong)" }}>
        <circle cx={CX} cy={CY} r={R_INNER} />
        <path d={INNER_TICKS} />
      </g>

      {/* The nine periods, drawing themselves in order. */}
      <g style={{ stroke: "var(--accent-strong)", opacity: 0.85 }}>
        {ARCS.map((arc, i) => (
          <path
            key={VIMSHOTTARI_GRAHAS[i]}
            data-draw
            d={arc.d}
            style={
              {
                "--draw-length": arc.length,
                "--draw-delay": `${0.2 + i * 0.3}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </g>

      {/* One point, once around in 120 seconds — a second a year. It passes beneath the planets. */}
      <g data-orbit style={{ ["--orbit-duration" as string]: "120s", transformBox: "view-box" }}>
        <circle
          cx={CX}
          cy={CY - R_RING}
          r="4"
          style={{ fill: "var(--accent-strong)", stroke: "none" }}
        />
      </g>

      {/* The graha of each period at the middle of its arc. */}
      {ARCS.map((arc, i) => {
        const key = VIMSHOTTARI_GRAHAS[i];
        if (!key) return null;
        return (
          <image
            key={key}
            href={`/planets/${key}.svg`}
            x={arc.mid[0] - PLANET / 2}
            y={arc.mid[1] - PLANET / 2}
            width={PLANET}
            height={PLANET}
          />
        );
      })}
    </svg>
  );
}
