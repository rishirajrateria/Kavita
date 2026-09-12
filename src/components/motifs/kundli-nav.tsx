import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { PLANETS, type PlanetKey } from "./planets";

/**
 * The Kundli hub — the landing page's centrepiece, and its navigation.
 *
 * A North Indian birth chart, drawn as the 3:2 rectangle it really is, large in the middle of
 * the page; its twelve houses are the site's doors, using what the houses already mean in Vedic
 * astrology (4th → home vastu, 7th → match making, 10th → career, 12th → from abroad…). Each
 * house carries its traditional signifying planet, drawn above the label — and set as the
 * pointer, so moving from one house to the next visibly changes the planet under the visitor's
 * hand. The centre, where every line meets, is "Book a reading".
 *
 * One SVG with native `<a>` elements around each house: every link is in the served HTML,
 * crawlable, keyboard-reachable, and needs no JavaScript. Hover, focus and the planet cursors
 * are pure CSS (`.kundli-nav` in globals.css; the cursors are 32px PNGs in /public/cursors,
 * rasterised from the planet drawings, with the plain pointer as fallback).
 *
 * Motion: the frame, diagonals and diamond draw themselves, then a single comet of light keeps
 * travelling each of them; every planet rotates and drifts in its own place; a single point of light travels the frame's own rectangle (`offset-path`); the
 * centre breathes; a hovered house glows in its planet's colour and the planet swells. All CSS,
 * all resting in the finished state.
 *
 * Geometry: frame 48..552 × 48..352 in a 600×400 viewBox. Diamond sides are parallel to the
 * diagonals in any rectangle, so vertices sit on the 174/300/426 × 124/200/276 grid.
 */
export interface KundliHouse {
  /** House number, 1–12, anticlockwise from the top as in a North Indian chart. */
  n: number;
  /** The house's traditional significator; drawn in the house and used as its cursor. */
  planet: PlanetKey;
  /** One or two words. It has to fit in a triangle at phone size. */
  label: string;
  /** What the house means, and what it opens — the tooltip and accessible name. */
  title: string;
  href: string;
}

export interface KundliNavProps {
  houses: readonly KundliHouse[];
  centre: { label: string; title: string; href: string };
  className?: string;
}

// Per-house layout. Each triangle is widest somewhere different — the top and bottom ones near
// the frame, the side ones at mid-height — so the label sits where its house is widest and the
// planet takes the narrower end. Side-triangle labels with two words wrap onto two lines, because
// Cinzel's capitals are wide and those houses are only ~126 units across at their widest.
interface HouseLayout {
  d: string;
  label: { x: number; y: number };
  planet: { x: number; y: number };
  wrap?: boolean;
}
const GEOMETRY: Record<number, HouseLayout> = {
  1: {
    d: "M300 48 426 124 300 200 174 124Z",
    label: { x: 300, y: 138 },
    planet: { x: 300, y: 92 },
  },
  2: { d: "M48 48 300 48 174 124Z", label: { x: 174, y: 74 }, planet: { x: 174, y: 104 } },
  3: {
    d: "M48 48 174 124 48 200Z",
    label: { x: 104, y: 128 },
    planet: { x: 84, y: 90 },
    wrap: true,
  },
  4: {
    d: "M48 200 174 124 300 200 174 276Z",
    label: { x: 150, y: 204 },
    planet: { x: 150, y: 156 },
  },
  5: {
    d: "M48 200 174 276 48 352Z",
    label: { x: 104, y: 280 },
    planet: { x: 84, y: 244 },
    wrap: true,
  },
  6: {
    d: "M48 352 174 276 300 352Z",
    label: { x: 174, y: 342 },
    planet: { x: 174, y: 296 },
  },
  7: {
    d: "M300 352 174 276 300 200 426 276Z",
    label: { x: 300, y: 272 },
    planet: { x: 300, y: 312 },
  },
  8: {
    d: "M300 352 426 276 552 352Z",
    label: { x: 426, y: 342 },
    planet: { x: 426, y: 296 },
  },
  9: {
    d: "M552 352 426 276 552 200Z",
    label: { x: 496, y: 280 },
    planet: { x: 516, y: 244 },
    wrap: true,
  },
  10: {
    d: "M552 200 426 276 300 200 426 124Z",
    label: { x: 450, y: 204 },
    planet: { x: 450, y: 156 },
  },
  11: {
    d: "M552 200 426 124 552 48Z",
    label: { x: 496, y: 128 },
    planet: { x: 516, y: 90 },
    wrap: true,
  },
  12: { d: "M552 48 300 48 426 124Z", label: { x: 426, y: 74 }, planet: { x: 426, y: 104 } },
};

const FRAME = "M48 48H552V352H48Z";
const DIAGONALS = "M48 48 552 352M552 48 48 352";
const DIAMOND = "M300 48 552 200 300 352 48 200Z";
const PLANET_SIZE = 54;
/** The Sun's drawing is mostly corona, so it reads small at the shared size; draw it larger. */
const PLANET_SCALE: Partial<Record<PlanetKey, number>> = { sun: 1.3 };

export function KundliNav({ houses, centre, className }: KundliNavProps) {
  const id = useId();

  return (
    <nav
      aria-label="Explore by house of the chart"
      className={cn("kundli-nav relative isolate aspect-[3/2] w-full", className)}
    >
      {/* The vastu mandala grid beneath the chart, breathing. */}
      <div
        data-breathe
        className="mandala-grid absolute inset-x-[8%] inset-y-[12%]"
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 600 400"
        className="absolute inset-0 size-full overflow-visible"
        role="presentation"
      >
        {/* A dark interior, so the chart reads as an object over the sky rather than a wireframe. */}
        <rect
          x="48"
          y="48"
          width="504"
          height="304"
          className="kundli-interior"
          aria-hidden="true"
        />
        {/* A soft outer border, as on a printed chart. */}
        <rect
          x="40"
          y="40"
          width="520"
          height="320"
          rx="6"
          fill="none"
          style={{ stroke: "var(--accent-border)", strokeOpacity: 0.28, strokeWidth: 0.8 }}
          aria-hidden="true"
        />
        {/* The chart's lines, beneath the planets and labels. Solid strokes draw themselves once
            and rest; a single comet of light then keeps travelling each of them. */}
        <g
          fill="none"
          className="kundli-lines pointer-events-none"
          style={{ stroke: "var(--accent-strong)", strokeWidth: 1.2, opacity: 0.92 }}
          aria-hidden="true"
        >
          <path data-draw d={FRAME} style={{ "--draw-delay": "0.15s" } as React.CSSProperties} />
          <path
            data-draw
            d={DIAGONALS}
            style={{ "--draw-delay": "0.55s" } as React.CSSProperties}
          />
          <path data-draw d={DIAMOND} style={{ "--draw-delay": "0.95s" } as React.CSSProperties} />
        </g>
        <g
          fill="none"
          className="pointer-events-none"
          style={{
            stroke: "var(--brass-200)",
            strokeWidth: 1.7,
            strokeLinecap: "round",
            opacity: 0.55,
          }}
          aria-hidden="true"
        >
          <path data-flow d={FRAME} style={{ "--flow-duration": "22s" } as React.CSSProperties} />
          <path
            data-flow
            d={DIAGONALS}
            style={{ "--flow-duration": "26s" } as React.CSSProperties}
          />
          <path data-flow d={DIAMOND} style={{ "--flow-duration": "17s" } as React.CSSProperties} />
        </g>

        {/* One point of light travelling the frame itself. */}
        <g
          data-travel
          className="pointer-events-none"
          style={{ ["--travel-duration" as string]: "24s" }}
          aria-hidden="true"
        >
          <circle r="7" style={{ fill: "var(--glow)" }} />
          <circle r="2.6" style={{ fill: "var(--brass-200)" }} />
        </g>
        {/* The centre's ring of ticks, turning slowly. */}
        <g data-turn style={{ ["--turn-duration" as string]: "160s" }} aria-hidden="true">
          <circle
            cx="300"
            cy="200"
            r="58"
            fill="none"
            style={{
              stroke: "var(--brass-300)",
              strokeOpacity: 0.55,
              strokeWidth: 1.2,
              strokeDasharray: "1.4 7.2",
            }}
          />
        </g>
        {/* The centre disc: parchment lit from within, its glow breathing behind it. Drawn here so
            it scales with the chart; the link below is only the hit target and the words. */}
        <defs>
          <radialGradient id={`${id}-parchment`} cx="42%" cy="36%" r="62%">
            <stop offset="0" stopColor="#fbefcf" />
            <stop offset="0.48" stopColor="#edd49a" />
            <stop offset="0.82" stopColor="#cfae66" />
            <stop offset="1" stopColor="#b8923a" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="var(--brass-200)" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="var(--brass-300)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--brass-300)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="kundli-centre-halo" data-pulse aria-hidden="true">
          <circle cx="300" cy="200" r="66" fill={`url(#${id}-halo)`} />
        </g>
        <circle
          cx="300"
          cy="200"
          r="52"
          fill="none"
          style={{ stroke: "var(--brass-300)", strokeOpacity: 0.25, strokeWidth: 0.6 }}
          aria-hidden="true"
        />
        <circle
          cx="300"
          cy="200"
          r="40"
          className="kundli-centre-disc"
          fill={`url(#${id}-parchment)`}
          aria-hidden="true"
        />

        {/* The twelve doors. Each is a link wrapping its house shape, planet and label. */}
        {houses.map((h) => {
          const g = GEOMETRY[h.n];
          if (!g) return null;
          const planet = PLANETS[h.planet];
          const titleId = `${id}-h${h.n}`;
          const lines = g.wrap && h.label.includes(" ") ? h.label.split(" ", 2) : [h.label];
          const size = PLANET_SIZE * (PLANET_SCALE[h.planet] ?? 1);
          return (
            <a
              key={h.n}
              href={h.href}
              className="kundli-house"
              aria-labelledby={titleId}
              data-house={h.n}
              style={
                {
                  "--house-glow": planet.glow,
                  cursor: `url(/cursors/${h.planet}.png) 16 16, pointer`,
                } as React.CSSProperties
              }
            >
              <title
                id={titleId}
              >{`${h.title} Signified by ${planet.name} (${planet.sanskrit}).`}</title>
              <path d={g.d} className="kundli-house-fill" />
              <image
                href={`/planets/${h.planet}.svg`}
                x={g.planet.x - size / 2}
                y={g.planet.y - size / 2}
                width={size}
                height={size}
                className="kundli-house-planet"
                style={
                  {
                    "--float-duration": `${6 + (h.n % 5)}s`,
                    "--float-delay": `${-(h.n * 0.9)}s`,
                  } as React.CSSProperties
                }
              />
              <text x={g.label.x} y={g.label.y} textAnchor="middle" className="kundli-house-label">
                {lines.map((line, i) => (
                  <tspan key={line} x={g.label.x} dy={i === 0 ? 0 : "1.2em"}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={g.label.x}
                y={g.label.y - 17}
                textAnchor="middle"
                className="kundli-house-number"
                aria-hidden="true"
              >
                {h.n}
              </text>
              <line
                data-draw
                x1={g.label.x - 11}
                x2={g.label.x + 11}
                y1={g.label.y + 7 + (lines.length - 1) * 16}
                y2={g.label.y + 7 + (lines.length - 1) * 16}
                className="kundli-house-rule"
                style={
                  {
                    "--draw-length": "22",
                    "--draw-delay": `${1.2 + h.n * 0.06}s`,
                  } as React.CSSProperties
                }
              />
            </a>
          );
        })}
      </svg>

      {/* The centre — where every line of the chart meets — is the one real call to action. */}
      <Link
        href={centre.href}
        title={centre.title}
        className="kundli-centre absolute top-1/2 left-1/2 flex aspect-square w-[13.4%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-[9%] text-center font-display text-[clamp(0.58rem,0.5rem+0.6vw,0.98rem)] leading-snug font-semibold tracking-[0.16em] uppercase no-underline"
      >
        <span className="relative">{centre.label}</span>
      </Link>
    </nav>
  );
}
