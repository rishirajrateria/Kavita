import localFont from "next/font/local";

/**
 * Self-hosted variable fonts via next/font/local (no Google Fonts request).
 *
 * Only the upright faces are shipped and preloaded: the italic files added ~97KB of
 * render-critical font bytes and pushed mobile LCP past 2s. Italics are synthesized by the
 * browser for now (font-synthesis default); add the italic faces back with `preload: false`
 * as a separate family if real italics are ever needed above the fold.
 * Files come from the @fontsource-variable packages; paths are relative to this file.
 *
 * Exposes CSS variables consumed by the Tailwind theme in globals.css:
 *   --font-fraunces  → `font-serif`   (headings)
 *   --font-inter     → `font-sans`    (body)
 */
export const fontSerif = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: true,
});

export const fontSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
  preload: true,
});
