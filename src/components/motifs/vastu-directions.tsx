import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";
import { type DirectionZone, zoneRect } from "./zones";

/**
 * Why a corner means something.
 *
 * The vastu purusha mandala drawn as what it actually is: a square plan of nine-by-nine padas,
 * read as nine zones, with the brahmasthan open at the centre and an element seated in each
 * corner — water in the north-east, fire in the south-east, earth in the south-west, air in the
 * north-west, drawn as the traditional tattva shapes (crescent, triangle, square, circle). The
 * eight direction ticks sit outside the plan; the sky above it is one circle with a single point
 * travelling it once every seven minutes. The house is fixed, the heavens move.
 *
 * `<VastuCompass />` is the plain eight-point rose. This is the square-plan reading, and it is
 * the one that explains why the south-west corner of a home is not the same as any other corner.
 *
 * No text: the direction and element names belong in the HTML around the figure.
 */
export interface VastuDirectionsProps extends MotifProps {
  /** Which zone reads as emphasised — a faint wash and a gold outline. Default `"none"`. */
  highlight?: DirectionZone;
}

const ORIGIN = 68;
const SIDE = 264;
const PADA = SIDE / 9;
const THIRD = SIDE / 3;
const END = ORIGIN + SIDE;

const round = (n: number) => Number(n.toFixed(2));

/** The 9x9 pada grid as two paths — sixteen subpaths, two nodes. */
const PADA_LINES = Array.from({ length: 8 }, (_, i) => round(ORIGIN + (i + 1) * PADA));
const PADA_VERTICAL = PADA_LINES.map((x) => `M${x} ${ORIGIN}V${END}`).join("");
const PADA_HORIZONTAL = PADA_LINES.map((y) => `M${ORIGIN} ${y}H${END}`).join("");
const ZONE_LINES =
  `M${ORIGIN + THIRD} ${ORIGIN}V${END}M${ORIGIN + 2 * THIRD} ${ORIGIN}V${END}` +
  `M${ORIGIN} ${ORIGIN + THIRD}H${END}M${ORIGIN} ${ORIGIN + 2 * THIRD}H${END}`;

export function VastuDirections({
  title = "The vastu purusha mandala read as nine zones and four elements",
  description = "A square plan of eighty-one padas divided into nine zones with north at the top. The brahmasthan at the centre is left open; the four corners carry the traditional element shapes — a crescent for water in the north-east, a triangle for fire in the south-east, a square for earth in the south-west and a circle for air in the north-west. Ticks outside the plan mark the eight directions, and one point travels the circle drawn around it.",
  highlight = "none",
  decorative = false,
  strokeWidth = 1.25,
  className,
  ...rest
}: VastuDirectionsProps) {
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

      {/* The sky: fixed circle, one moving point. */}
      <circle cx="200" cy="200" r="190" style={{ stroke: "var(--mandala)" }} />
      <g data-orbit style={{ ["--orbit-duration" as string]: "420s", transformBox: "view-box" }}>
        <circle cx="200" cy="10" r="3.5" style={{ fill: "var(--accent-strong)", stroke: "none" }} />
      </g>

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

      {/* The plan: eighty-one padas, then the nine zones over them. */}
      <g data-breathe style={{ stroke: "var(--mandala)" }}>
        <path d={PADA_VERTICAL} />
        <path d={PADA_HORIZONTAL} />
      </g>
      <g style={{ stroke: "var(--mandala-strong)" }}>
        <path d={ZONE_LINES} />
        <path d="M200 60V42M340 200H358M200 340V358M42 200H60" />
        <path d="M337 63 350 50M337 337 350 350M63 337 50 350M63 63 50 50" />
      </g>
      <rect
        data-draw
        x={ORIGIN}
        y={ORIGIN}
        width={SIDE}
        height={SIDE}
        style={{ stroke: "var(--accent-strong)", "--draw-length": SIDE * 4 } as React.CSSProperties}
      />

      {/* The four elements, as the shapes the tradition gives them. */}
      <g style={{ stroke: "var(--accent-strong)", opacity: 0.85 }}>
        <circle cx="112" cy="112" r="11" />
        <path d="M277 108A11 11 0 0 0 299 108" />
        <path d="M101 277h22v22h-22z" />
        <path d="M288 277 299 299 277 299Z" />
      </g>

      {/* The brahmasthan, drawn open. */}
      <rect
        x="168"
        y="168"
        width="64"
        height="64"
        strokeDasharray="3 6"
        style={{ stroke: "var(--accent-strong)", strokeOpacity: 0.7 }}
      />
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
