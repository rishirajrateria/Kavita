/**
 * The nine grahas of Vedic astrology.
 *
 * The drawings themselves are standalone animated SVGs in `public/planets/` — lit spheres with
 * terminator shading, limb glow and surface texture that slowly rotates in place — each carrying
 * its own `<style>` so it animates wherever it is shown. They are used twice on the home page: as
 * `<image>`s inside each house of the kundli hub, and rasterised to 32px PNGs in `public/cursors/`
 * as the pointer itself, so moving from one house to the next visibly changes the planet under
 * the visitor's hand. Astrology is planetary effect before it is anything else; this is the page
 * saying so without a paragraph. Regenerate the cursors (headless Chromium, 32×32, background
 * omitted) whenever a drawing changes.
 *
 * Each house carries its traditional significator (karaka): Sun for the 1st (the self), Mercury
 * for the 2nd (speech, wealth), Mars for the 3rd (courage), Moon for the 4th (home, mother),
 * Jupiter for the 5th, 9th and 11th (children, dharma, gains — Jupiter really is the karaka of
 * all three), Saturn for the 6th and 10th (obstacles, karma), Venus for the 7th (partnership),
 * Ketu for the 8th (the hidden), Rahu for the 12th (foreign lands).
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
