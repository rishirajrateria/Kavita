import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { PLANETS, PlanetSymbols, type PlanetKey } from "./planets";

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
 * are pure CSS (`.kundli-nav` in globals.css; cursors are 32px PNGs in /public/cursors with the
 * SVG as fallback).
 *
 * Motion: the frame, diagonals and diamond draw themselves, then a dashed light keeps flowing
 * along them; a single point of light travels the frame's own rectangle (`offset-path`); the
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

// Polygon and label anchor per house; the planet sits above the label.
const GEOMETRY: Record<number, { d: string; x: number; y: number }> = {
  1: { d: "M300 48 426 124 300 200 174 124Z", x: 300, y: 140 },
  2: { d: "M48 48 300 48 174 124Z", x: 174, y: 98 },
  3: { d: "M48 48 174 124 48 200Z", x: 106, y: 138 },
  4: { d: "M48 200 174 124 300 200 174 276Z", x: 174, y: 216 },
  5: { d: "M48 200 174 276 48 352Z", x: 106, y: 290 },
  6: { d: "M48 352 174 276 300 352Z", x: 174, y: 334 },
  7: { d: "M300 352 174 276 300 200 426 276Z", x: 300, y: 292 },
  8: { d: "M300 352 426 276 552 352Z", x: 426, y: 334 },
  9: { d: "M552 352 426 276 552 200Z", x: 494, y: 290 },
  10: { d: "M552 200 426 276 300 200 426 124Z", x: 426, y: 216 },
  11: { d: "M552 200 426 124 552 48Z", x: 494, y: 138 },
  12: { d: "M552 48 300 48 426 124Z", x: 426, y: 98 },
};

const FRAME = "M48 48H552V352H48Z";
const DIAGONALS = "M48 48 552 352M552 48 48 352";
const DIAMOND = "M300 48 552 200 300 352 48 200Z";
const PLANET_SIZE = 26;

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
        <PlanetSymbols />

        {/* The twelve doors. Each is a link wrapping its house shape, planet and label. */}
        {houses.map((h) => {
          const g = GEOMETRY[h.n];
          if (!g) return null;
          const planet = PLANETS[h.planet];
          const titleId = `${id}-h${h.n}`;
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
                  cursor: `url(/cursors/${h.planet}.png) 16 16, url(/cursors/${h.planet}.svg) 16 16, pointer`,
                } as React.CSSProperties
              }
            >
              <title
                id={titleId}
              >{`${h.title} Signified by ${planet.name} (${planet.sanskrit}).`}</title>
              <path d={g.d} className="kundli-house-fill" />
              <use
                href={`#planet-${h.planet}`}
                x={g.x - PLANET_SIZE / 2}
                y={g.y - PLANET_SIZE - 12}
                width={PLANET_SIZE}
                height={PLANET_SIZE}
                className="kundli-house-planet"
              />
              <text x={g.x} y={g.y} textAnchor="middle" className="kundli-house-label">
                {h.label}
              </text>
              <text
                x={g.x}
                y={g.y + 13}
                textAnchor="middle"
                className="kundli-house-number"
                aria-hidden="true"
              >
                {h.n}
              </text>
            </a>
          );
        })}

        {/* The chart's lines, above the house fills. Solid strokes draw themselves once and then
            rest; a dashed twin of each keeps light travelling along them, slowly, for good. */}
        <g
          fill="none"
          className="pointer-events-none"
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
          <path data-flow d={FRAME} style={{ "--flow-duration": "44s" } as React.CSSProperties} />
          <path
            data-flow
            d={DIAGONALS}
            style={{ "--flow-duration": "52s" } as React.CSSProperties}
          />
          <path data-flow d={DIAMOND} style={{ "--flow-duration": "36s" } as React.CSSProperties} />
        </g>

        {/* One point of light travelling the frame itself. */}
        <g data-travel className="pointer-events-none" aria-hidden="true">
          <circle r="7" style={{ fill: "var(--glow)" }} />
          <circle r="2.6" style={{ fill: "var(--brass-200)" }} />
        </g>
      </svg>

      {/* The centre — where every line of the chart meets — is the one real call to action. */}
      <Link
        href={centre.href}
        title={centre.title}
        className="kundli-centre absolute top-1/2 left-1/2 flex aspect-square w-[11%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-[8%] text-center font-serif text-[clamp(0.7rem,1.15vw,1.05rem)] leading-tight font-medium tracking-wide no-underline"
      >
        <span
          data-pulse
          aria-hidden="true"
          className="kundli-centre-glow absolute inset-0 rounded-full"
        />
        <span className="relative">{centre.label}</span>
      </Link>
    </nav>
  );
}
