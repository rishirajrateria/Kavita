import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";
import { type DirectionZone, zoneRect } from "./zones";

/**
 * A home seen the way a vastu consultation sees it: a square plan divided into thirds, north up,
 * four corner rooms around an open central cross, and the brahmasthan — the centre the tradition
 * keeps clear — marked and left empty.
 *
 * The partitions sit exactly on the thirds, so every value of `highlight` lands on a real room
 * rather than cutting across a wall: `highlight="south-west"` shades the bottom-left room, which
 * is the corner the tradition gives to the head of the household. A reader can see which corner
 * "south-west" means before the prose tells them.
 *
 * Motion: the walls draw themselves in sequence and the brahmasthan holds a slow pulse. Nothing
 * moves that carries meaning; the drawing is complete at rest.
 */
export interface FloorPlanProps extends MotifProps {
  /** Which zone reads as emphasised — a faint wash and a gold outline. Default `"none"`. */
  highlight?: DirectionZone;
}

const ORIGIN = 2;
const SIDE = 396;

function draw(delay: string, length: number): React.CSSProperties {
  return { "--draw-delay": delay, "--draw-length": length } as React.CSSProperties;
}

export function FloorPlan({
  title = "Plan of a home divided into the nine vastu zones",
  description = "A square floor plan with north at the top, divided into thirds: four corner rooms around an open central cross, a door on the east wall, and the brahmasthan marked and left clear at the centre.",
  highlight = "none",
  decorative = false,
  strokeWidth = 1.25,
  className,
  ...rest
}: FloorPlanProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;
  const zone = zoneRect(highlight, ORIGIN, SIDE);

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

      {zone ? (
        <rect
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          style={{
            fill: "var(--accent-strong)",
            fillOpacity: 0.14,
            stroke: "var(--accent-strong)",
            strokeOpacity: 0.55,
          }}
        />
      ) : null}

      <g style={{ stroke: "currentColor", opacity: 0.78 }}>
        <path data-draw d="M398 110 398 398 2 398 2 2 398 2 398 60" style={draw("0.2s", 1534)} />
        <path
          data-draw
          d="M134 2V134M266 2V134M134 266V398M266 266V398M2 134H134M266 134H398M2 266H134M266 266H398"
          style={draw("0.55s", 1056)}
        />
        <path data-draw d="M398 110 348 110A50 50 0 0 1 398 60" style={draw("0.9s", 128)} />
      </g>

      <g style={{ stroke: "var(--accent-strong)" }}>
        {/* The brahmasthan: drawn open, because that is the whole instruction. */}
        <rect
          x="150"
          y="150"
          width="100"
          height="100"
          strokeDasharray="3 6"
          style={{ strokeOpacity: 0.7 }}
        />
        {/* North, so every direction in the drawing is unambiguous without a label. */}
        <path d="M200 66V34" style={{ strokeOpacity: 0.7 }} />
        <path d="M192 44 200 28 208 44Z" style={{ fill: "var(--accent-strong)", stroke: "none" }} />
      </g>
      <circle
        data-pulse
        cx="200"
        cy="200"
        r="4"
        style={{
          fill: "var(--accent-strong)",
          stroke: "none",
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      />
    </svg>
  );
}
