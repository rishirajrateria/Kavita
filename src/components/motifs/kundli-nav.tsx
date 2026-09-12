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
 * Motion: the frame, diagonals and diamond draw themselves in sequence, and then a dashed light
 * keeps travelling along them (`data-flow`) for as long as the page is open; the elliptical rim
 * turns once every four minutes; one point of light orbits it; the centre breathes. All CSS, all
 * resting in the finished state, none of it JavaScript.
 *
 * Geometry: a 3:2 rectangle, which is how the chart is actually drawn — the square version is a
 * screen convenience. The frame runs 48..552 × 48..352 in a 600×400 viewBox. The diamond joins
 * the edge midpoints and its sides are parallel to the diagonals (true for any rectangle), so the
 * four kite houses (1, 4, 7, 10) are rhombi and the other eight are triangles, with every vertex
 * on the 174/300/426 × 124/200/276 grid.
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
  1: { d: "M300 48 426 124 300 200 174 124Z", x: 300, y: 128 },
  2: { d: "M48 48 300 48 174 124Z", x: 174, y: 88 },
  3: { d: "M48 48 174 124 48 200Z", x: 108, y: 128 },
  4: { d: "M48 200 174 124 300 200 174 276Z", x: 174, y: 204 },
  5: { d: "M48 200 174 276 48 352Z", x: 108, y: 280 },
  6: { d: "M48 352 174 276 300 352Z", x: 174, y: 326 },
  7: { d: "M300 352 174 276 300 200 426 276Z", x: 300, y: 280 },
  8: { d: "M300 352 426 276 552 352Z", x: 426, y: 326 },
  9: { d: "M552 352 426 276 552 200Z", x: 492, y: 280 },
  10: { d: "M552 200 426 276 300 200 426 124Z", x: 426, y: 204 },
  11: { d: "M552 200 426 124 552 48Z", x: 492, y: 128 },
  12: { d: "M552 48 300 48 426 124Z", x: 426, y: 88 },
};

// The chart's three strokes, in the order a chart is cast by hand: frame, diagonals, diamond.
const FRAME = "M48 48H552V352H48Z";
const DIAGONALS = "M48 48 552 352M552 48 48 352";
const DIAMOND = "M300 48 552 200 300 352 48 200Z";

// Rim: an ellipse just outside the frame, with a tick at every 30° like the twelve houses.
const RX = 288;
const RY = 190;
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const x1 = 300 + RX * Math.sin(a);
  const y1 = 200 - RY * Math.cos(a);
  const x2 = 300 + (RX - 12) * Math.sin(a);
  const y2 = 200 - (RY - 8) * Math.cos(a);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
});

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
        {/* Rim: two ellipses and twelve ticks, turning; one point of light orbiting. The orbit
            is a rotation inside a non-uniform scale, which is what makes a circle trace an
            ellipse. */}
        <g data-turn style={{ ["--turn-duration" as string]: "240s" }} aria-hidden="true">
          <ellipse
            cx="300"
            cy="200"
            rx={RX}
            ry={RY}
            fill="none"
            style={{ stroke: "var(--mandala)" }}
          />
          <ellipse
            cx="300"
            cy="200"
            rx={RX - 14}
            ry={RY - 10}
            fill="none"
            style={{ stroke: "var(--mandala)" }}
          />
          <g fill="none" style={{ stroke: "var(--mandala-strong)" }}>
            {TICKS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
        <g transform={`translate(300 200) scale(${(RX / RY).toFixed(4)} 1)`} aria-hidden="true">
          {/* transform-box: view-box makes (0,0) — the ellipse centre inside the translated
              parent — the pivot; the default 50% 50% resolves to the SVG viewport instead. */}
          <g
            data-orbit
            style={{
              ["--orbit-duration" as string]: "48s",
              transformBox: "view-box",
              transformOrigin: "0 0",
            }}
          >
            <circle cx="0" cy={-RY} r="2.4" style={{ fill: "var(--accent-strong)" }} />
            <circle cx="0" cy={-RY} r="6.5" style={{ fill: "var(--glow)" }} />
          </g>
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
          style={{ stroke: "var(--accent-strong)", strokeWidth: 1.1, opacity: 0.9 }}
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
            strokeWidth: 1.6,
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
      </svg>

      {/* The centre — where every line of the chart meets — is the one real call to action. An
          HTML link rather than an SVG one so it can be a proper button at every size. */}
      <Link
        href={centre.href}
        title={centre.title}
        className="kundli-centre absolute top-1/2 left-1/2 flex aspect-square w-[11%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-[8%] text-center font-sans text-[clamp(0.6rem,1vw,0.95rem)] leading-tight font-semibold tracking-wide no-underline"
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
