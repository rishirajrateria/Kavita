import type * as React from "react";
import { AstronomicalLines } from "@/components/motifs";

/** The ecliptic of `AstronomicalLines` (its 640 × 360 viewBox), as the path a point can travel. */
const ECLIPTIC = 'path("M0 300 C 140 150, 500 120, 640 40")';

/**
 * The hero figure of the legal pages (SPEC §2.4, "legal hero"): the astronomical linework in
 * gold hairlines, with one point of light travelling the ecliptic once every ninety seconds —
 * the hub's travelling point, composed over the motif rather than drawn into it. The overlay
 * shares the motif's viewBox so the point stays on the line at every width; it is decorative,
 * hidden under `prefers-reduced-motion`, and the figure beneath rests complete.
 */
export function LegalLines({ description }: { description: string }) {
  return (
    <div className="relative w-full text-accent-strong">
      <AstronomicalLines strokeWidth={0.9} description={description} />
      <svg
        viewBox="0 0 640 360"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <g
          data-travel
          className="motion-reduce:hidden"
          style={
            {
              "--travel-path": ECLIPTIC,
              "--travel-duration": "90s",
            } as React.CSSProperties
          }
        >
          <circle r="6" style={{ fill: "var(--glow)" }} />
          <circle r="2.2" style={{ fill: "var(--accent-strong)" }} />
        </g>
      </svg>
    </div>
  );
}
