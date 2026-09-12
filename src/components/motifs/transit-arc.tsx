import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * A transit, drawn as what it is: a slow planet crossing a fixed part of the wheel.
 *
 * Twelve sectors — the signs — with an adjacent run of them marked and the Moon standing in the
 * middle one. That is the shape of sade-sati: Saturn passing through the sign before the natal
 * Moon, the sign of the Moon, and the sign after it. One point travels the rim once every seven
 * minutes, which is as close to Saturn's pace as a drawing can honestly get.
 *
 * The default span is deliberately generic — no chart, no birth data, nothing about any reader.
 * All naming belongs in the HTML around the figure.
 */
export interface TransitArcProps extends MotifProps {
  /** Index of the first marked sector, 0–11, counting clockwise from the top. Default 11. */
  spanStart?: number;
  /** How many adjacent sectors are marked, 1–12. Default 3. */
  spanLength?: number;
}

const CX = 200;
const CY = 200;
const R_INNER = 118;
const R_OUTER = 168;
const R_RIM = 190;

function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [Number((CX + r * Math.cos(rad)).toFixed(2)), Number((CY + r * Math.sin(rad)).toFixed(2))];
}

/** Start angle of sector `i`, in SVG degrees, with sector 0 beginning at the top. */
const sectorAngle = (i: number) => i * 30 - 90;

function annularSector(from: number, to: number): string {
  const large = to - from > 180 ? 1 : 0;
  const [ax, ay] = polar(R_OUTER, from);
  const [bx, by] = polar(R_OUTER, to);
  const [cx, cy] = polar(R_INNER, to);
  const [dx, dy] = polar(R_INNER, from);
  return `M${ax} ${ay}A${R_OUTER} ${R_OUTER} 0 ${large} 1 ${bx} ${by}L${cx} ${cy}A${R_INNER} ${R_INNER} 0 ${large} 0 ${dx} ${dy}Z`;
}

const DIVIDERS = Array.from({ length: 12 }, (_, i) => {
  const [x1, y1] = polar(R_INNER, sectorAngle(i));
  const [x2, y2] = polar(R_OUTER, sectorAngle(i));
  return `M${x1} ${y1} ${x2} ${y2}`;
}).join("");

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const mid = sectorAngle(i) + 15;
  const [x1, y1] = polar(R_OUTER + 5, mid);
  const [x2, y2] = polar(R_OUTER + 13, mid);
  return `M${x1} ${y1} ${x2} ${y2}`;
}).join("");

export function TransitArc({
  title = "A slow transit across three signs of the wheel",
  description = "A ring of twelve sectors with three adjacent sectors shaded and a crescent moon standing in the middle one, and a single point travelling the rim outside them — the shape of a slow planetary transit across the sign before, the sign of, and the sign after the natal Moon.",
  spanStart = 11,
  spanLength = 3,
  decorative = false,
  strokeWidth = 1.25,
  className,
  ...rest
}: TransitArcProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;

  const length = Math.min(Math.max(Math.round(spanLength), 1), 12);
  const start = ((Math.round(spanStart) % 12) + 12) % 12;
  const marked = Array.from({ length }, (_, k) => (start + k) % 12);
  const moonSector = (start + Math.floor((length - 1) / 2)) % 12;
  const [moonX, moonY] = polar((R_INNER + R_OUTER) / 2, sectorAngle(moonSector) + 15);

  return (
    <svg
      viewBox="0 0 400 400"
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

      {marked.map((i) => (
        <path
          key={i}
          d={annularSector(sectorAngle(i), sectorAngle(i) + 30)}
          style={{ fill: "var(--accent-strong)", fillOpacity: 0.13, stroke: "none" }}
        />
      ))}

      <g style={{ stroke: "var(--mandala-strong)" }}>
        <path d={DIVIDERS} />
        <path d={TICKS} />
      </g>
      <g style={{ stroke: "var(--accent-strong)", opacity: 0.85 }}>
        <circle
          data-draw
          cx={CX}
          cy={CY}
          r={R_OUTER}
          style={{ "--draw-length": 1056, "--draw-delay": "0.2s" } as React.CSSProperties}
        />
        <circle
          data-draw
          cx={CX}
          cy={CY}
          r={R_INNER}
          style={{ "--draw-length": 742, "--draw-delay": "0.5s" } as React.CSSProperties}
        />
      </g>

      {/* The Moon, standing still while the transit passes over it. */}
      <g transform={`translate(${moonX} ${moonY})`} style={{ stroke: "var(--accent-strong)" }}>
        <path d="M0 -11A11 11 0 1 0 0 11A8.5 8.5 0 1 1 0 -11Z" />
      </g>

      {/* The transiting planet: one point, once every seven minutes. */}
      <circle cx={CX} cy={CY} r={R_RIM} style={{ stroke: "var(--mandala)" }} />
      <g data-orbit style={{ ["--orbit-duration" as string]: "420s", transformBox: "view-box" }}>
        <circle
          data-pulse
          cx={CX}
          cy={CY - R_RIM}
          r="4.5"
          style={{
            fill: "var(--accent-strong)",
            stroke: "none",
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        />
      </g>
    </svg>
  );
}
