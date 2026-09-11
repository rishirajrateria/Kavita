/**
 * Email theme: the site palette (CLAUDE.md §4 — ivory ground, deep indigo text, antique-gold
 * rule) in inline styles, because email clients ignore stylesheets and web fonts. Headings use a
 * system serif stack in place of Fraunces; body copy a humanist sans stack in place of Inter.
 */
import type { CSSProperties } from "react";

export const palette = {
  ivory: "#f8f4ec",
  parchment: "#efe8db",
  indigo: "#161a33",
  indigoMuted: "#4b5070",
  gold: "#b8923a",
  goldSoft: "#e6d7ad",
  white: "#ffffff",
} as const;

export const serif = 'Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif';
export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const styles = {
  body: {
    backgroundColor: palette.ivory,
    color: palette.indigo,
    fontFamily: sans,
    margin: 0,
    padding: "32px 12px",
  },
  container: {
    backgroundColor: palette.white,
    border: `1px solid ${palette.goldSoft}`,
    borderRadius: 4,
    maxWidth: 560,
    padding: "36px 40px 28px",
  },
  eyebrow: {
    color: palette.gold,
    fontFamily: sans,
    fontSize: 12,
    letterSpacing: "0.16em",
    margin: "0 0 12px",
    textTransform: "uppercase",
  },
  h1: {
    color: palette.indigo,
    fontFamily: serif,
    fontSize: 26,
    fontWeight: 500,
    lineHeight: 1.25,
    margin: "0 0 20px",
  },
  h2: {
    color: palette.indigo,
    fontFamily: serif,
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.3,
    margin: "28px 0 10px",
  },
  p: {
    color: palette.indigo,
    fontFamily: sans,
    fontSize: 15,
    lineHeight: 1.6,
    margin: "0 0 14px",
  },
  muted: {
    color: palette.indigoMuted,
    fontFamily: sans,
    fontSize: 13,
    lineHeight: 1.6,
    margin: "0 0 10px",
  },
  rule: {
    borderColor: palette.gold,
    borderTop: `1px solid ${palette.gold}`,
    borderBottom: "none",
    margin: "24px 0",
    width: 72,
  },
  panel: {
    backgroundColor: palette.parchment,
    borderLeft: `3px solid ${palette.gold}`,
    padding: "16px 20px",
    margin: "0 0 20px",
  },
  panelLabel: {
    color: palette.indigoMuted,
    fontFamily: sans,
    fontSize: 12,
    letterSpacing: "0.08em",
    margin: "0 0 4px",
    textTransform: "uppercase",
  },
  panelValue: {
    color: palette.indigo,
    fontFamily: serif,
    fontSize: 17,
    lineHeight: 1.4,
    margin: "0 0 12px",
  },
  button: {
    backgroundColor: palette.gold,
    borderRadius: 3,
    color: palette.indigo,
    display: "inline-block",
    fontFamily: sans,
    fontSize: 15,
    fontWeight: 600,
    padding: "12px 22px",
    textDecoration: "none",
  },
  link: {
    color: palette.indigo,
    textDecoration: "underline",
  },
  li: {
    color: palette.indigo,
    fontFamily: sans,
    fontSize: 15,
    lineHeight: 1.6,
    margin: "0 0 6px",
  },
  footer: {
    color: palette.indigoMuted,
    fontFamily: sans,
    fontSize: 12,
    lineHeight: 1.6,
    margin: "0 0 6px",
  },
} satisfies Record<string, CSSProperties>;
