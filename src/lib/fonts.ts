import localFont from "next/font/local";

/**
 * Self-hosted variable fonts via next/font/local (no Google Fonts request).
 *
 * Cormorant (display, used at 300 weight) against Karla (body). The high-contrast serif
 * carries the mystical register; Karla keeps the running text plain and legible so the
 * pages still read as a professional practice rather than an occult pastiche.
 *
 * Only the upright faces are shipped and preloaded: the italic files added ~97KB of
 * render-critical font bytes and pushed mobile LCP past 2s. Italics are synthesized by the
 * browser for now (font-synthesis default); add the italic faces back with `preload: false`
 * as a separate family if real italics are ever needed above the fold.
 * Files come from the @fontsource-variable packages; paths are relative to this file.
 *
 * Exposes CSS variables consumed by the Tailwind theme in globals.css:
 *   --font-cormorant → `font-serif`   (display + headings)
 *   --font-karla     → `font-sans`    (body)
 */
export const fontSerif = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/cormorant/files/cormorant-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: true,
});

export const fontSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/karla/files/karla-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-karla",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
  preload: true,
});
