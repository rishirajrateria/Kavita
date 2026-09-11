/**
 * Chart vocabulary shared by every admin chart. One accent (antique gold) carries the primary
 * series, a foreground-derived indigo carries the comparison series, and the rest is context —
 * every colour is a theme token so light and dark are both right without a second palette.
 * Text never wears a series colour (dataviz rule); marks do.
 */
import type { CSSProperties } from "react";

/** Set on the chart container so the SVG can use `var(--series-1)` … `var(--chart-grid)`. */
export const CHART_VARS = {
  "--series-1": "var(--cta)",
  "--series-2": "color-mix(in srgb, var(--foreground) 62%, var(--background))",
  "--series-3": "color-mix(in srgb, var(--foreground) 32%, var(--background))",
  "--series-4": "color-mix(in srgb, var(--cta) 45%, var(--background))",
  "--chart-grid": "color-mix(in srgb, var(--border) 70%, transparent)",
  "--chart-axis": "var(--muted-foreground)",
  "--chart-surface": "var(--card)",
} as CSSProperties;

export const SERIES_COLOURS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
] as const;

export const CHART_FONT = "var(--font-sans), system-ui, sans-serif";

/** 1,284 → "1.3K", 4200000 → "4.2M"; integers below 1,000 are shown whole. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "–";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 10_000) return `${trim(value / 1_000)}K`;
  if (abs >= 1_000) return `${trim(value / 1_000)}K`;
  return Number.isInteger(value) ? value.toLocaleString("en") : trim(value);
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString("en", { maximumFractionDigits: 1 });
}

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? Math.round(value).toLocaleString("en") : "–";
}

/** 0.234 → "23.4%"; expects a ratio, not a percentage. */
export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "–";
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Milliseconds → "1m 24s" / "48s". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m}m ${rest}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Clean axis ticks: 0, 1,000, 2,000 … choose a step from {1,2,5}×10^n giving ≤ `count` ticks. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 5, 10].map((m) => m * pow);
  const step = candidates.find((c) => c >= rough) ?? candidates[3] ?? rough;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** `2026-09-11` → "11 Sep"; `2026-09` → "Sep 26"; anything else is returned as-is. */
export function formatAxisDate(key: string): string {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (day) return `${Number(day[3])} ${MONTHS[Number(day[2]) - 1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(key);
  if (month) return `${MONTHS[Number(month[2]) - 1]} ${month[1]?.slice(2)}`;
  return key;
}

/** Text-safe id fragment for `aria-labelledby` pairs. */
export function slugId(prefix: string, title: string): string {
  return `${prefix}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}
