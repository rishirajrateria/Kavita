import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * The practitioner's hours, and a visitor's, on 24-hour rings.
 *
 * One ring (the practitioner's day) or two (hers and the visitor's local day), each a hairline
 * rim with twenty-four ticks, midnight at the top, and the consulting hours lit as an arc from
 * the opening minute to the closing one. A single point travels each ring once in a real day.
 * When the hours are assumed rather than confirmed the lit arc is dashed, and the caller must
 * say so in the figure's caption ("Hours to be confirmed by the practitioner").
 *
 * No text is drawn inside the SVG: the zone names and the windows are HTML beneath the figure,
 * where they can be read, copied and quoted. The accessible description carries the same facts.
 */
export interface ClockWindow {
  /** Opening time as minutes after local midnight, 0–1439. */
  openMinutes: number;
  /** Closing time as minutes after local midnight, 0–1439. May be earlier than `openMinutes` for a window that crosses midnight. */
  closeMinutes: number;
  /** The zone or place the ring belongs to — used in the accessible description only. */
  label: string;
}

export interface ClocksProps extends Omit<MotifProps, "local"> {
  practitioner: ClockWindow;
  local?: ClockWindow;
  /** True when the hours are a default rather than the practitioner's confirmed hours. */
  assumed: boolean;
}

const R = 70;
const CY = 100;
const DAY = 1440;

function clampMinutes(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return ((Math.round(m) % DAY) + DAY) % DAY;
}

function polar(cx: number, r: number, minutes: number): [number, number] {
  const rad = ((minutes / DAY) * 360 - 90) * (Math.PI / 180);
  return [Number((cx + r * Math.cos(rad)).toFixed(2)), Number((CY + r * Math.sin(rad)).toFixed(2))];
}

/** The lit arc from `open` clockwise to `close`, as a path; a full circle when they coincide. */
function litArc(cx: number, open: number, close: number): string {
  const length = (close - open + DAY) % DAY;
  if (length === 0) {
    return `M${cx} ${CY - R}A${R} ${R} 0 1 1 ${cx} ${CY + R}A${R} ${R} 0 1 1 ${cx} ${CY - R}`;
  }
  const [ax, ay] = polar(cx, R, open);
  const [bx, by] = polar(cx, R, close);
  return `M${ax} ${ay}A${R} ${R} 0 ${length > DAY / 2 ? 1 : 0} 1 ${bx} ${by}`;
}

function ticks(cx: number): string {
  return Array.from({ length: 24 }, (_, h) => {
    const major = h % 6 === 0;
    const [x1, y1] = polar(cx, R, h * 60);
    const [x2, y2] = polar(cx, R - (major ? 7 : 3.5), h * 60);
    return `M${x1} ${y1} ${x2} ${y2}`;
  }).join("");
}

function hhmm(minutes: number): string {
  const m = clampMinutes(minutes);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function describe(w: ClockWindow): string {
  return `${w.label}: ${hhmm(w.openMinutes)} to ${hhmm(w.closeMinutes)}`;
}

function Ring({
  cx,
  window: w,
  assumed,
  delay,
}: {
  cx: number;
  window: ClockWindow;
  assumed: boolean;
  delay: string;
}) {
  const open = clampMinutes(w.openMinutes);
  const close = clampMinutes(w.closeMinutes);
  return (
    <g>
      <path d={ticks(cx)} style={{ stroke: "var(--mandala-strong)" }} />
      <circle
        data-draw
        cx={cx}
        cy={CY}
        r={R}
        style={
          {
            stroke: "var(--accent-strong)",
            strokeOpacity: 0.6,
            "--draw-length": 440,
            "--draw-delay": delay,
          } as React.CSSProperties
        }
      />
      <circle cx={cx} cy={CY} r={R - 14} style={{ stroke: "var(--mandala)" }} />
      <circle cx={cx} cy={CY} r={2.2} style={{ fill: "var(--accent-strong)", stroke: "none" }} />
      {/* The consulting hours, lit. Dashed while they are only assumed. */}
      <path
        d={litArc(cx, open, close)}
        strokeDasharray={assumed ? "4 4" : undefined}
        strokeLinecap="butt"
        style={{ stroke: "var(--accent-strong)", strokeOpacity: 0.85, strokeWidth: 3 }}
      />
      {/* One point, once around in a real day. */}
      <g
        data-orbit
        style={{
          ["--orbit-duration" as string]: "1440s",
          transformBox: "view-box",
          transformOrigin: `${cx}px ${CY}px`,
        }}
      >
        <circle
          cx={cx}
          cy={CY - R}
          r="3.2"
          style={{ fill: "var(--accent-strong)", stroke: "none" }}
        />
      </g>
    </g>
  );
}

export function Clocks({
  practitioner,
  local,
  assumed,
  title = "Consultation hours on a 24-hour ring",
  description,
  decorative = false,
  strokeWidth = 1,
  className,
  ...rest
}: ClocksProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const resolvedDescription =
    description ??
    [
      local
        ? "Two 24-hour rings with midnight at the top, the consulting hours lit on each."
        : "A 24-hour ring with midnight at the top and the consulting hours lit.",
      describe(practitioner),
      local ? describe(local) : undefined,
      assumed ? "Hours to be confirmed by the practitioner." : undefined,
    ]
      .filter(Boolean)
      .join(" ");
  const descId = `${id}-desc`;
  const two = Boolean(local);

  return (
    <svg
      viewBox={two ? "0 0 400 200" : "100 0 200 200"}
      fill="none"
      strokeLinecap="round"
      style={{ strokeWidth }}
      className={cn("h-auto w-full overflow-visible", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...rest}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      <desc id={descId}>{resolvedDescription}</desc>
      <Ring cx={two ? 100 : 200} window={practitioner} assumed={assumed} delay="0.2s" />
      {local ? <Ring cx={300} window={local} assumed={assumed} delay="0.6s" /> : null}
    </svg>
  );
}
