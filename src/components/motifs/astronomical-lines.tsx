import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * Thin orbital arcs, ecliptic ticks and a few small bodies — a quiet hero
 * accent evoking astronomical linework. Wide 16:9 viewBox; scale with CSS.
 * Usually rendered decoratively (`decorative`) behind or beside a hero.
 */
export function AstronomicalLines({
  title = "Astronomical orbital linework",
  description,
  decorative = false,
  strokeWidth = 1,
  className,
  ...props
}: MotifProps) {
  const titleId = useId();
  const descId = description ? `${titleId}-desc` : undefined;

  return (
    <svg
      viewBox="0 0 640 360"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={cn("h-auto w-full", className)}
      preserveAspectRatio="xMidYMid meet"
      {...a11yAttrs(decorative, titleId, descId)}
      {...props}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{description}</desc> : null}

      {/* nested orbits centred right of middle */}
      <ellipse cx="400" cy="200" rx="230" ry="150" opacity="0.9" />
      <ellipse cx="400" cy="200" rx="175" ry="112" opacity="0.7" strokeDasharray="2 5" />
      <ellipse cx="400" cy="200" rx="118" ry="74" opacity="0.8" />
      <ellipse cx="400" cy="200" rx="60" ry="36" opacity="0.6" />

      {/* ecliptic — a long, shallow arc across the whole width */}
      <path d="M0 300 C 140 150, 500 120, 640 40" opacity="0.6" />

      {/* ticks along the ecliptic */}
      {Array.from({ length: 13 }, (_, i) => {
        const t = i / 12;
        // cubic bezier evaluation for the same path as above
        const p0 = [0, 300];
        const p1 = [140, 150];
        const p2 = [500, 120];
        const p3 = [640, 40];
        const u = 1 - t;
        const x =
          u * u * u * p0[0]! + 3 * u * u * t * p1[0]! + 3 * u * t * t * p2[0]! + t * t * t * p3[0]!;
        const y =
          u * u * u * p0[1]! + 3 * u * u * t * p1[1]! + 3 * u * t * t * p2[1]! + t * t * t * p3[1]!;
        const len = i % 3 === 0 ? 7 : 4;
        return <line key={i} x1={x} y1={y - len} x2={x} y2={y + len} opacity="0.7" />;
      })}

      {/* bodies */}
      <circle cx="400" cy="200" r="5" />
      <circle cx="518" cy="126" r="3.5" />
      <circle cx="282" cy="200" r="2.5" />
      <circle cx="170" cy="200" r="2" />
      <circle cx="455" cy="53" r="1.5" />
      <circle cx="575" cy="285" r="2" />

      {/* faint crosshair on the primary body */}
      <path d="M380 200 h-14 M420 200 h14 M400 180 v-14 M400 220 v14" opacity="0.5" />
    </svg>
  );
}
