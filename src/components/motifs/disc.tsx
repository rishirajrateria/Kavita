import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The parchment disc — the hub's centre, lifted out so every other page can carry the same
 * call to action in the same object.
 *
 * Drawn exactly as `KundliNav` draws it (parchment lit from within, a breathing halo behind, a
 * hairline, a slowly turning ring of ticks), but as a standalone figure in the hub's 160-unit
 * geometry. The SVG's viewBox is the 80-unit square of the face itself, so `size` is the
 * diameter of the parchment face, and the halo and ticks around it render as ink overflow
 * (`overflow: visible`) — they spill softly the way a glow should without ever adding to the
 * page's scroll width. The link over it is the hit target and the words; `.disc*` in
 * `src/styles/scene.css` carries the ink colour, hover lift and focus ring.
 *
 * `KundliNav` keeps its own in-SVG disc, which scales with the chart; this is for every page
 * that is not the hub.
 */
export interface DiscProps {
  href: string;
  /** The words on the disc. Keep them to two or three short words: Cinzel capitals are wide. */
  label: string;
  /** Tooltip and the link's accessible description. */
  title?: string;
  /** Face diameter: 5.5 · 8 · 11 rem. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE: Record<NonNullable<DiscProps["size"]>, string> = {
  sm: "5.5rem",
  md: "8rem",
  lg: "11rem",
};

export function Disc({ href, label, title, size = "md", className }: DiscProps) {
  const id = useId();

  return (
    <span
      className={cn("disc relative inline-block aspect-square align-middle", className)}
      style={{ width: SIZE[size] }}
    >
      <svg viewBox="40 40 80 80" className="disc-svg" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-parchment`} cx="42%" cy="36%" r="62%">
            <stop offset="0" stopColor="#fbefcf" />
            <stop offset="0.48" stopColor="#edd49a" />
            <stop offset="0.82" stopColor="#cfae66" />
            <stop offset="1" stopColor="#b8923a" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="var(--brass-200)" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="var(--brass-300)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--brass-300)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* The ring of ticks, turning slowly. */}
        <g data-turn style={{ ["--turn-duration" as string]: "160s" }}>
          <circle
            cx="80"
            cy="80"
            r="58"
            fill="none"
            style={{
              stroke: "var(--brass-300)",
              strokeOpacity: 0.55,
              strokeWidth: 1.2,
              strokeDasharray: "1.4 7.2",
            }}
          />
        </g>
        {/* The glow behind the face, breathing. */}
        <g className="disc-halo" data-pulse>
          <circle cx="80" cy="80" r="66" fill={`url(#${id}-halo)`} />
        </g>
        <circle
          cx="80"
          cy="80"
          r="52"
          fill="none"
          style={{ stroke: "var(--brass-300)", strokeOpacity: 0.25, strokeWidth: 0.6 }}
        />
        <circle cx="80" cy="80" r="40" className="disc-face" fill={`url(#${id}-parchment)`} />
      </svg>

      <Link
        href={href}
        title={title}
        className="disc-link absolute inset-0 flex items-center justify-center rounded-full px-[14%] text-center font-display text-[clamp(0.58rem,0.5rem+0.4vw,0.8rem)] leading-snug font-semibold tracking-[0.16em] uppercase no-underline"
      >
        <span className="relative">{label}</span>
      </Link>
    </span>
  );
}
