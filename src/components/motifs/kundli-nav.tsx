import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The Kundli hub — the landing page's centrepiece, and its navigation.
 *
 * A North Indian birth chart draws itself large in the middle of the page, and its twelve houses
 * are the site's doors. The mapping is not decorative: it uses what the houses already mean in
 * Vedic astrology. The 4th house is home and property, so it opens home vastu; the 7th is
 * partnership, so it opens match making; the 10th is career; the 11th is gains and business; the
 * 12th is foreign lands, so it opens consulting from abroad. Someone who knows astrology will
 * recognise the logic at once; someone who does not will be curious enough to click. The centre
 * of the chart — where every line meets — is "Book a reading".
 *
 * It is one SVG with native `<a>` elements around each house: every link is in the served HTML,
 * crawlable, keyboard-reachable, and needs no JavaScript. Hover and focus are pure CSS
 * (`.kundli-nav` in globals.css). Labels are `<text>` inside the figure so they draw with it, and
 * every house also carries a `<title>` so the tooltip and the accessible name say what it opens.
 *
 * Motion: the frame, diagonals and diamond draw themselves in sequence; the rim of house ticks
 * turns once every four minutes; one point of light orbits it; the centre breathes. All CSS, all
 * transform/opacity, all resting in the finished state.
 *
 * Geometry: the square runs 48..352 in a 400 viewBox. The diamond joins the edge midpoints and
 * its sides are parallel to the diagonals, so the four kite houses (1, 4, 7, 10) are rhombi and
 * the other eight are triangles. Vertices sit on the 124/200/276 grid.
 */
export interface KundliHouse {
  /** House number, 1–12, anticlockwise from the top as in a North Indian chart. */
  n: number;
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

// Polygon points and label anchor per house; see the geometry note above.
const GEOMETRY: Record<number, { d: string; x: number; y: number }> = {
  1: { d: "M200 48 276 124 200 200 124 124Z", x: 200, y: 128 },
  2: { d: "M48 48 200 48 124 124Z", x: 124, y: 84 },
  3: { d: "M48 48 124 124 48 200Z", x: 90, y: 128 },
  4: { d: "M48 200 124 124 200 200 124 276Z", x: 124, y: 204 },
  5: { d: "M48 200 124 276 48 352Z", x: 90, y: 280 },
  6: { d: "M48 352 124 276 200 352Z", x: 124, y: 330 },
  7: { d: "M200 352 124 276 200 200 276 276Z", x: 200, y: 280 },
  8: { d: "M200 352 276 276 352 352Z", x: 276, y: 330 },
  9: { d: "M352 352 276 276 352 200Z", x: 310, y: 280 },
  10: { d: "M352 200 276 276 200 200 276 124Z", x: 276, y: 204 },
  11: { d: "M352 200 276 124 352 48Z", x: 310, y: 128 },
  12: { d: "M352 48 200 48 276 124Z", x: 276, y: 84 },
};

const TICKS = [
  "M200 10v14",
  "M295 35.5l-7 12.1",
  "M364.5 105l-12.1 7",
  "M390 200h-14",
  "M364.5 295l-12.1-7",
  "M295 364.5l-7-12.1",
  "M200 390v-14",
  "M105 364.5l7-12.1",
  "M35.5 295l12.1-7",
  "M10 200h14",
  "M35.5 105l12.1 7",
  "M105 35.5l7 12.1",
] as const;

export function KundliNav({ houses, centre, className }: KundliNavProps) {
  const id = useId();

  return (
    <nav
      aria-label="Explore by house of the chart"
      className={cn("kundli-nav relative isolate aspect-square w-full", className)}
    >
      {/* The vastu mandala grid beneath the chart, breathing. */}
      <div data-breathe className="mandala-grid absolute inset-[12%]" aria-hidden="true" />

      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 size-full overflow-visible"
        role="presentation"
      >
        {/* Rim: two rings and twelve house ticks, turning; one point of light orbiting. */}
        <g data-turn style={{ ["--turn-duration" as string]: "240s" }} aria-hidden="true">
          <circle cx="200" cy="200" r="190" fill="none" style={{ stroke: "var(--mandala)" }} />
          <circle cx="200" cy="200" r="178" fill="none" style={{ stroke: "var(--mandala)" }} />
          <g fill="none" style={{ stroke: "var(--mandala-strong)" }}>
            {TICKS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
        <g data-orbit style={{ ["--orbit-duration" as string]: "36s" }} aria-hidden="true">
          <circle cx="200" cy="16" r="2.6" style={{ fill: "var(--accent-strong)" }} />
          <circle cx="200" cy="16" r="7" style={{ fill: "var(--glow)" }} />
        </g>

        {/* The twelve doors. Each is a link wrapping its house shape and label. */}
        {houses.map((h) => {
          const g = GEOMETRY[h.n];
          if (!g) return null;
          const titleId = `${id}-h${h.n}`;
          return (
            <a
              key={h.n}
              href={h.href}
              className="kundli-house"
              aria-labelledby={titleId}
              data-house={h.n}
            >
              <title id={titleId}>{h.title}</title>
              <path d={g.d} className="kundli-house-fill" />
              <text
                x={g.x}
                y={g.y}
                textAnchor="middle"
                className="kundli-house-label"
                style={{ fontSize: 10 }}
              >
                {h.label}
              </text>
              <text
                x={g.x}
                y={g.y + 12}
                textAnchor="middle"
                className="kundli-house-number"
                style={{ fontSize: 6.5 }}
                aria-hidden="true"
              >
                {h.n}
              </text>
            </a>
          );
        })}

        {/* The chart's lines, drawn last so they sit above the house fills, in the order a chart
            is cast by hand: frame, diagonals, diamond. */}
        <g
          fill="none"
          className="pointer-events-none"
          style={{ stroke: "var(--accent-strong)", strokeWidth: 1.1, opacity: 0.9 }}
          aria-hidden="true"
        >
          <rect
            data-draw
            x="48"
            y="48"
            width="304"
            height="304"
            style={{ "--draw-delay": "0.15s" } as React.CSSProperties}
          />
          <path
            data-draw
            d="M48 48 352 352M352 48 48 352"
            style={{ "--draw-delay": "0.55s" } as React.CSSProperties}
          />
          <path
            data-draw
            d="M200 48 352 200 200 352 48 200Z"
            style={{ "--draw-delay": "0.95s" } as React.CSSProperties}
          />
        </g>
      </svg>

      {/* The centre — where every line of the chart meets — is the one real call to action. An
          HTML link rather than an SVG one so it can be a proper button at every size. */}
      <Link
        href={centre.href}
        title={centre.title}
        className="kundli-centre absolute top-1/2 left-1/2 flex aspect-square w-[17%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-[10%] text-center font-sans text-[clamp(0.6rem,1.4vw,0.95rem)] leading-tight font-semibold tracking-wide no-underline"
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
