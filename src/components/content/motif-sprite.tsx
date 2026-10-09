/** The six door glyphs a page may reference with `<use href="#m-…">`. */
export type DoorMotif = "north-chart" | "south-chart" | "compass" | "plan" | "lines" | "ornament";

export const DOOR_MOTIFS: readonly DoorMotif[] = [
  "north-chart",
  "south-chart",
  "compass",
  "plan",
  "lines",
  "ornament",
] as const;

/**
 * One hidden SVG of `<symbol>`s, rendered once per page (by the page, `aria-hidden`), so that
 * twenty-four doors cost one drawing (SPEC §2.3). Each glyph is a 48-unit hairline instrument
 * of the tradition in `currentColor`: a North Indian chart, a South Indian chart, the compass
 * rose, a plan, the astronomical lines, and the four-point star of the hero.
 */
export function MotifSprite() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="absolute size-0 overflow-hidden"
    >
      <symbol id="m-north-chart" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <rect x="4" y="4" width="40" height="40" />
        <path d="M4 4 44 44M44 4 4 44M24 4 44 24 24 44 4 24Z" />
      </symbol>
      <symbol id="m-south-chart" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <rect x="4" y="4" width="40" height="40" />
        <path d="M14 4V44M34 4V44M4 14H44M4 34H44M24 4V14M24 34V44M4 24H14M34 24H44" />
      </symbol>
      <symbol id="m-compass" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <circle cx="24" cy="24" r="19" />
        <circle cx="24" cy="24" r="13" strokeDasharray="1.5 3" />
        <path d="M24 5V43M5 24H43M10.6 10.6 37.4 37.4M37.4 10.6 10.6 37.4" />
        <path d="M24 1.5 26.5 6.5h-5Z" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="m-plan" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <path d="M44 32V44H4V4H44V22" />
        <path d="M4 26H24M20 4V26M16 26V44" />
        <path d="M44 22 34 22A10 10 0 0 0 44 32" />
        <path d="M30 10V4" />
      </symbol>
      <symbol id="m-lines" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <circle cx="24" cy="24" r="19" />
        <ellipse cx="24" cy="24" rx="19" ry="7" />
        <path d="M24 5V43M5 24H43" strokeDasharray="1.5 3" />
        <circle cx="33" cy="17" r="1.6" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="m-ornament" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <path
          d="M24 4c1 12.4 7.6 19 20 20-12.4 1-19 7.6-20 20-1-12.4-7.6-19-20-20 12.4-1 19-7.6 20-20Z"
          fill="currentColor"
          stroke="none"
        />
      </symbol>
    </svg>
  );
}
