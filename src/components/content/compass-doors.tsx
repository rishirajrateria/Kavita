import { useId } from "react";
import { CX, CY, DIRECTIONS, Disc, polar, R_INNER, R_OUTER } from "@/components/motifs";
import { cn } from "@/lib/utils";

export type CompassCornerDir = "NE" | "SE" | "SW" | "NW";
export type VastuElement = "water" | "fire" | "earth" | "air";

export interface CompassCorner {
  dir: CompassCornerDir;
  href: string;
  label: string;
  sanskrit: string;
  element: VastuElement;
}

export interface CompassDoorsProps {
  corners: CompassCorner[];
  centre: { href: string; label: string; title: string };
  className?: string;
}

/** Each element's glow, as a token (SPEC §2.3). */
const ELEMENT_GLOW: Record<VastuElement, string> = {
  water: "var(--blue-400)",
  fire: "var(--rose-400)",
  earth: "var(--brass-500)",
  air: "var(--bone-200)",
};

const SECTOR_IN = 52;
const SECTOR_OUT = 78;
const R_SKY = 92;
const R_LABEL = 102;
/** The rose sits inset in its box so the labels outside the rim stay inside it (doors.css). */
const INSET = 0.08;

const fix = (n: number) => Number(n.toFixed(2));

/** An annular sector from `a0` to `a1` degrees between the two radii. */
function sector(a0: number, a1: number): string {
  const [ox0, oy0] = polar(SECTOR_OUT, a0).map(fix);
  const [ox1, oy1] = polar(SECTOR_OUT, a1).map(fix);
  const [ix0, iy0] = polar(SECTOR_IN, a0).map(fix);
  const [ix1, iy1] = polar(SECTOR_IN, a1).map(fix);
  return `M${ox0} ${oy0}A${SECTOR_OUT} ${SECTOR_OUT} 0 0 1 ${ox1} ${oy1}L${ix1} ${iy1}A${SECTOR_IN} ${SECTOR_IN} 0 0 0 ${ix0} ${iy0}Z`;
}

/** The tattva shape of each element, centred on (x, y): crescent, triangle, square, circle. */
function tattva(element: VastuElement, x: number, y: number): React.ReactNode {
  switch (element) {
    case "water":
      return <path d={`M${fix(x - 7)} ${fix(y - 2)}A7 7 0 0 0 ${fix(x + 7)} ${fix(y - 2)}`} />;
    case "fire":
      return (
        <path d={`M${x} ${fix(y - 7)} ${fix(x + 7)} ${fix(y + 6)} ${fix(x - 7)} ${fix(y + 6)}Z`} />
      );
    case "earth":
      return <rect x={fix(x - 6)} y={fix(y - 6)} width="12" height="12" />;
    case "air":
      return <circle cx={x} cy={y} r="6.5" />;
  }
}

/** Where a point at radius `r` and angle `deg` sits, as percentages of the (inset) box. */
function pct(r: number, deg: number): { x: string; y: string } {
  const [x, y] = polar(r, deg);
  const s = 1 - 2 * INSET;
  return { x: `${fix(50 + ((x - CX) * s) / 2)}%`, y: `${fix(50 + ((y - CY) * s) / 2)}%` };
}

/**
 * The compass whose corners open (SPEC §2.3): the vastu rose with its four intercardinal
 * corners as annular-sector doors to their own terms — Ishaan, Agneya, Nairutya, Vayavya —
 * each glowing in its element's colour, the tattva shape as its glyph. The cardinals are
 * labelled and are not doors; the brahmasthan at the centre is the parchment disc. One
 * geometry at every width: the sector is 26 units deep, about 48 px at 390 px.
 */
export function CompassDoors({ corners, centre, className }: CompassDoorsProps) {
  const id = useId();

  return (
    <div className={cn("compass-doors w-full", className)}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ strokeWidth: 0.9 }}
        className="text-accent-strong"
        role="presentation"
      >
        {/* The sky: one circle, one point, seven minutes around. */}
        <circle cx={CX} cy={CY} r={R_SKY} style={{ stroke: "var(--mandala)" }} />
        <g data-orbit style={{ ["--orbit-duration" as string]: "420s", transformBox: "view-box" }}>
          <circle
            cx={CX}
            cy={CY - R_SKY}
            r="2.4"
            style={{ fill: "var(--accent-strong)", stroke: "none" }}
          />
        </g>

        {/* The rose: rings and spokes, drawing themselves. */}
        <circle
          data-draw
          cx={CX}
          cy={CY}
          r={R_OUTER}
          style={{ "--draw-length": 490, "--draw-delay": "0.15s" } as React.CSSProperties}
        />
        <circle
          data-draw
          cx={CX}
          cy={CY}
          r={R_INNER}
          strokeDasharray="1.5 3"
          style={{ "--draw-length": 378, "--draw-delay": "0.5s" } as React.CSSProperties}
        />
        <circle cx={CX} cy={CY} r={3} />
        {DIRECTIONS.map((d, i) => {
          const cardinal = i % 2 === 0;
          const [x1, y1] = polar(cardinal ? 10 : SECTOR_IN - 8, d.angle);
          const [x2, y2] = polar(cardinal ? R_OUTER : SECTOR_IN, d.angle);
          return (
            <line
              key={d.label}
              x1={fix(x1)}
              y1={fix(y1)}
              x2={fix(x2)}
              y2={fix(y2)}
              style={{ strokeWidth: cardinal ? 0.9 : 0.6 }}
            />
          );
        })}

        {/* The degree ring, turning once in ten minutes. */}
        <g data-turn style={{ ["--turn-duration" as string]: "600s" }}>
          {Array.from({ length: 24 }, (_, i) => {
            const angle = i * 15;
            const major = i % 6 === 0;
            const [x1, y1] = polar(R_OUTER + 4, angle);
            const [x2, y2] = polar(R_OUTER + (major ? 10 : 7), angle);
            return (
              <line
                key={angle}
                x1={fix(x1)}
                y1={fix(y1)}
                x2={fix(x2)}
                y2={fix(y2)}
                style={{ strokeWidth: 0.6, strokeOpacity: 0.7 }}
              />
            );
          })}
        </g>

        {/* The north pointer, swaying four degrees. */}
        <g
          data-sway
          style={{
            ["--sway-deg" as string]: "4deg",
            transformBox: "view-box",
            transformOrigin: `${CX}px ${CY}px`,
          }}
        >
          <path
            d={`M${CX} ${CY - R_OUTER - 6} l4 8 h-8 z`}
            style={{ fill: "var(--accent-strong)", stroke: "none" }}
          />
        </g>

        {/* The four corners, each a door. */}
        {corners.map((c) => {
          const dir = DIRECTIONS.find((d) => d.label === c.dir);
          if (!dir) return null;
          const titleId = `${id}-${c.dir}`;
          const [gx, gy] = polar((SECTOR_IN + SECTOR_OUT) / 2, dir.angle).map(fix);
          return (
            <a
              key={c.dir}
              href={c.href}
              className="door"
              aria-labelledby={titleId}
              style={{ ["--door-glow" as string]: ELEMENT_GLOW[c.element] }}
            >
              <title id={titleId}>{`${c.label} (${c.sanskrit}) — the ${c.dir} corner.`}</title>
              <path d={sector(dir.angle - 45, dir.angle + 45)} className="door-fill" />
              <g className="door-glyph" style={{ stroke: "var(--accent-strong)" }}>
                {tattva(c.element, gx ?? CX, gy ?? CY)}
              </g>
            </a>
          );
        })}
      </svg>

      {/* The labels, in HTML, outside the rim. */}
      {corners.map((c) => {
        const dir = DIRECTIONS.find((d) => d.label === c.dir);
        if (!dir) return null;
        const at = pct(R_LABEL, dir.angle);
        return (
          <span
            key={c.dir}
            aria-hidden="true"
            data-corner
            className="compass-label max-w-[6rem] text-center font-display text-[0.62rem] font-semibold tracking-[0.22em] text-foreground uppercase"
            style={{ ["--x" as string]: at.x, ["--y" as string]: at.y }}
          >
            {`${c.sanskrit} · ${c.dir}`}
          </span>
        );
      })}
      {DIRECTIONS.filter((_, i) => i % 2 === 0).map((d) => {
        const at = pct(R_LABEL, d.angle);
        const name =
          d.label === "N" ? "North" : d.label === "E" ? "East" : d.label === "S" ? "South" : "West";
        return (
          <span
            key={d.label}
            className="compass-label max-w-[4.5rem] text-center font-display text-[0.62rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase"
            style={{ ["--x" as string]: at.x, ["--y" as string]: at.y }}
          >
            {`${name} · ${d.sanskrit}`}
          </span>
        );
      })}

      <Disc href={centre.href} label={centre.label} title={centre.title} size="sm" />
    </div>
  );
}
