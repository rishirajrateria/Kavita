import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * The Instrument — the practice's thesis as one drawing.
 *
 * A North Indian kundli (square, both diagonals, an inscribed diamond) laid directly over the
 * vastu purusha mandala (the 9x9 pada grid, with the brahmasthan open at its centre), inside a
 * ring of twelve house ticks. Two instruments, one square: the chart says what is unfolding and
 * when, the mandala says where in the building it is being helped or blocked.
 *
 * It is the one graphic on the site that no other practitioner could use, because no one else
 * reads both together. That is the whole reason it is the centrepiece rather than a zodiac wheel.
 *
 * Motion (all CSS, all optional): the ring turns once every four minutes, the mandala breathes,
 * and the kundli's three strokes draw themselves in sequence. Every element RESTS in its finished
 * state — `stroke-dashoffset: 0`, full opacity — so the drawing is complete before any frame runs
 * and `prefers-reduced-motion` simply gets the finished figure.
 */
export interface InstrumentProps extends MotifProps {
  /** Slow the ring down or speed it up. Default `240s` — one turn every four minutes. */
  turnDuration?: string;
}

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

export function Instrument({
  title = "A kundli chart drawn over the vastu purusha mandala",
  description = "A North Indian birth chart — a square with its diagonals and an inscribed diamond — laid over the nine-by-nine grid of the vastu purusha mandala, with the brahmasthan left open at the centre and twelve house ticks around the rim.",
  decorative = false,
  strokeWidth = 1,
  turnDuration = "240s",
  className,
  ...rest
}: InstrumentProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div className={cn("relative isolate aspect-square w-full", className)}>
      {/* The mandala grid and its open centre are plain boxes: 9x9 gradient lines cost one
          paint, where 20 <line> elements would cost twenty nodes for the same drawing. */}
      <div data-breathe className="mandala-grid absolute inset-[12%]" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 aspect-square w-[25.3%] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border"
        style={{ borderColor: "var(--mandala-strong)" }}
      >
        <span
          className="absolute top-1/2 left-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--accent-strong)" }}
        />
      </div>

      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 size-full overflow-visible [&_*]:fill-none"
        style={{ strokeWidth }}
        {...a11yAttrs(decorative, titleId, descId)}
        {...rest}
      >
        {!decorative && <title id={titleId}>{title}</title>}
        {!decorative && description && <desc id={descId}>{description}</desc>}

        <g data-turn style={{ ["--turn-duration" as string]: turnDuration }}>
          <circle cx="200" cy="200" r="190" style={{ stroke: "var(--mandala)" }} />
          <circle cx="200" cy="200" r="178" style={{ stroke: "var(--mandala)" }} />
          <g style={{ stroke: "var(--mandala-strong)" }}>
            {TICKS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>

        {/* The kundli. Drawn last so it sits above the mandala, and drawn in three passes —
            frame, diagonals, diamond — because that is the order it is cast by hand. */}
        <g style={{ stroke: "var(--accent-strong)", opacity: 0.85 }}>
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
            style={{ "--draw-delay": "0.5s" } as React.CSSProperties}
          />
          <path
            data-draw
            d="M200 48 352 200 200 352 48 200Z"
            style={{ "--draw-delay": "0.85s" } as React.CSSProperties}
          />
        </g>
      </svg>
    </div>
  );
}
