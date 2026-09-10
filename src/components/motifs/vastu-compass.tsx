import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

const DIRECTIONS = [
  { label: "N", angle: -90, sanskrit: "Uttara" },
  { label: "NE", angle: -45, sanskrit: "Ishanya" },
  { label: "E", angle: 0, sanskrit: "Purva" },
  { label: "SE", angle: 45, sanskrit: "Agneya" },
  { label: "S", angle: 90, sanskrit: "Dakshina" },
  { label: "SW", angle: 135, sanskrit: "Nairutya" },
  { label: "W", angle: 180, sanskrit: "Paschima" },
  { label: "NW", angle: 225, sanskrit: "Vayavya" },
] as const;

const CX = 100;
const CY = 100;
const R_OUTER = 78;
const R_INNER = 60;
const R_LABEL = 91;

function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

export interface VastuCompassProps extends MotifProps {
  /** Include the Sanskrit direction names in the accessible description. */
  withSanskritNames?: boolean;
  /** Hide the N/NE/E… text labels (keeps the rose only). */
  hideLabels?: boolean;
}

/**
 * Eight-direction vastu compass rose. Thin line-art with cardinal and
 * intercardinal spokes and labels; `currentColor` throughout.
 */
export function VastuCompass({
  title = "Vastu compass rose showing the eight directions",
  description,
  withSanskritNames = true,
  hideLabels = false,
  decorative = false,
  strokeWidth = 1,
  className,
  ...props
}: VastuCompassProps) {
  const titleId = useId();
  const resolvedDescription =
    description ??
    (withSanskritNames ? DIRECTIONS.map((d) => `${d.label}: ${d.sanskrit}`).join(", ") : undefined);
  const descId = resolvedDescription ? `${titleId}-desc` : undefined;

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={cn("size-full", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...props}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{resolvedDescription}</desc> : null}

      <circle cx={CX} cy={CY} r={R_OUTER} />
      <circle cx={CX} cy={CY} r={R_INNER} strokeDasharray="1.5 3" />
      <circle cx={CX} cy={CY} r={3} />

      {/* spokes: cardinal full, intercardinal shorter */}
      {DIRECTIONS.map((d, i) => {
        const cardinal = i % 2 === 0;
        const [x1, y1] = polar(cardinal ? 10 : R_INNER - 12, d.angle);
        const [x2, y2] = polar(R_OUTER, d.angle);
        return (
          <line
            key={d.label}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={cardinal ? strokeWidth : strokeWidth * 0.75}
          />
        );
      })}

      {/* north pointer */}
      <path d={`M${CX} ${CY - R_OUTER - 6} l4 8 h-8 z`} />

      {/* degree ticks every 15° */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = i * 15;
        const major = i % 6 === 0;
        const [x1, y1] = polar(R_OUTER, angle);
        const [x2, y2] = polar(R_OUTER - (major ? 6 : 3), angle);
        return (
          <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={strokeWidth * 0.75} />
        );
      })}

      {hideLabels
        ? null
        : DIRECTIONS.map((d) => {
            const [x, y] = polar(R_LABEL, d.angle);
            return (
              <text
                key={d.label}
                x={x}
                y={y}
                fill="currentColor"
                stroke="none"
                fontSize="9"
                fontFamily="inherit"
                textAnchor="middle"
                dominantBaseline="middle"
                letterSpacing="0.5"
              >
                {d.label}
              </text>
            );
          })}
    </svg>
  );
}
