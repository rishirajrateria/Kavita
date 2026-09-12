/**
 * The nine grahas of Vedic astrology as small line-and-fill drawings, each in a 32×32 box.
 *
 * Used twice on the home page: as `<symbol>`s drawn inside each house of the kundli hub, and —
 * rendered to PNG at build time in `public/cursors/` — as the pointer itself, so that moving
 * from one house to the next visibly changes the planet under the visitor's hand. Astrology is
 * planetary effect before it is anything else; this is the page saying so without a paragraph.
 *
 * Each house carries its traditional significator (karaka): Sun for the 1st (the self), Mercury
 * for the 2nd (speech, wealth), Mars for the 3rd (courage), Moon for the 4th (home, mother),
 * Jupiter for the 5th, 9th and 11th (children, dharma, gains — Jupiter really is the karaka of
 * all three), Saturn for the 6th and 10th (obstacles, karma), Venus for the 7th (partnership),
 * Ketu for the 8th (the hidden), Rahu for the 12th (foreign lands).
 *
 * `public/cursors/*.svg` hold the same drawings as standalone files; keep the two in step.
 */
export type PlanetKey =
  "sun" | "moon" | "mars" | "mercury" | "jupiter" | "venus" | "saturn" | "rahu" | "ketu";

export interface Planet {
  key: PlanetKey;
  /** English and Sanskrit names, for the accessible title. */
  name: string;
  sanskrit: string;
  /** The planet's glow colour for its house on hover; a token so both themes work. */
  glow: string;
}

export const PLANETS: Record<PlanetKey, Planet> = {
  sun: { key: "sun", name: "Sun", sanskrit: "Surya", glow: "var(--brass-300)" },
  moon: { key: "moon", name: "Moon", sanskrit: "Chandra", glow: "var(--bone-100)" },
  mars: { key: "mars", name: "Mars", sanskrit: "Mangala", glow: "var(--rose-400)" },
  mercury: {
    key: "mercury",
    name: "Mercury",
    sanskrit: "Budha",
    glow: "var(--aqua-glow, #8fd3c4)",
  },
  jupiter: { key: "jupiter", name: "Jupiter", sanskrit: "Guru", glow: "var(--brass-400)" },
  venus: { key: "venus", name: "Venus", sanskrit: "Shukra", glow: "var(--rose-300)" },
  saturn: { key: "saturn", name: "Saturn", sanskrit: "Shani", glow: "var(--violet-300)" },
  rahu: { key: "rahu", name: "Rahu", sanskrit: "Rahu", glow: "var(--violet-400)" },
  ketu: { key: "ketu", name: "Ketu", sanskrit: "Ketu", glow: "var(--brass-200)" },
};

/**
 * The `<symbol>` definitions. Render once inside an SVG's `<defs>`, then `<use href="#planet-sun">`
 * anywhere in that SVG. Fills are literal because these are illustrations of specific bodies, not
 * UI surfaces — the Sun is gold in both themes.
 */
export function PlanetSymbols() {
  return (
    <defs>
      <symbol id="planet-sun" viewBox="0 0 32 32">
        <g stroke="#f5d08a" strokeWidth="1.4" strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={16 + 10 * Math.cos(a)}
                y1={16 + 10 * Math.sin(a)}
                x2={16 + 14 * Math.cos(a)}
                y2={16 + 14 * Math.sin(a)}
              />
            );
          })}
        </g>
        <circle cx="16" cy="16" r="7" fill="#f5d08a" />
        <circle cx="16" cy="16" r="4.5" fill="#fbf0d8" />
      </symbol>

      <symbol id="planet-moon" viewBox="0 0 32 32">
        <path d="M18 4a12 12 0 1 0 0 24 9.5 12 0 1 1 0-24Z" fill="#f3ede3" />
        <circle cx="12" cy="12" r="1.3" fill="#d2c6b2" />
        <circle cx="10" cy="19" r="1" fill="#d2c6b2" />
      </symbol>

      <symbol id="planet-mars" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="9" fill="#e0664a" />
        <ellipse cx="16" cy="8.5" rx="3.5" ry="1.4" fill="#fbf7f0" opacity="0.85" />
        <circle cx="12" cy="18" r="1.6" fill="#b8452f" />
      </symbol>

      <symbol id="planet-mercury" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="7" fill="#8fd3c4" />
        <circle cx="13.5" cy="14" r="1.4" fill="#5fb3a2" />
        <circle cx="18.5" cy="18.5" r="1" fill="#5fb3a2" />
      </symbol>

      <symbol id="planet-jupiter" viewBox="0 0 32 32">
        <clipPath id="planet-jupiter-clip">
          <circle cx="16" cy="16" r="11" />
        </clipPath>
        <circle cx="16" cy="16" r="11" fill="#e8b45e" />
        <g clipPath="url(#planet-jupiter-clip)" fill="#c9903a">
          <rect x="4" y="10" width="24" height="2.2" />
          <rect x="4" y="15" width="24" height="3" />
          <rect x="4" y="21" width="24" height="1.8" />
        </g>
        <ellipse
          cx="20"
          cy="18"
          rx="2.6"
          ry="1.5"
          fill="#f5d08a"
          clipPath="url(#planet-jupiter-clip)"
        />
      </symbol>

      <symbol id="planet-venus" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="#f7a6d6" opacity="0.28" />
        <circle cx="16" cy="16" r="8" fill="#fbf0d8" />
        <circle cx="16" cy="16" r="5" fill="#f7e2c8" />
      </symbol>

      <symbol id="planet-saturn" viewBox="0 0 32 32">
        <g transform="rotate(-22 16 16)">
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="4.2"
            fill="none"
            stroke="#c9b3ff"
            strokeWidth="1.5"
          />
        </g>
        <circle cx="16" cy="16" r="7" fill="#d2c6b2" />
        <g transform="rotate(-22 16 16)">
          <path d="M2.4 17.2a14 4.2 0 0 0 27.2 0" fill="none" stroke="#c9b3ff" strokeWidth="1.5" />
        </g>
      </symbol>

      <symbol id="planet-rahu" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="9" fill="#a98cf5" />
        <circle cx="20" cy="14" r="8.5" fill="#07081a" opacity="0.55" />
        <circle cx="10.5" cy="17.5" r="1.8" fill="#c9b3ff" />
      </symbol>

      <symbol id="planet-ketu" viewBox="0 0 32 32">
        <path d="M9 23 26 6l-9 15Z" fill="#f8e2b6" opacity="0.6" />
        <path d="M9 23 22 10l-5 11Z" fill="#f5d08a" opacity="0.8" />
        <circle cx="9.5" cy="22.5" r="4.5" fill="#f5d08a" />
      </symbol>
    </defs>
  );
}
