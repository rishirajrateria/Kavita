/**
 * Static, clearly synthetic data for the design preview route (`/admin/preview`, non-production
 * only) and the chart render tests. Never shown to a signed-in owner as real analytics.
 */
import type { BarDatum } from "./bar-chart";
import type { MapDot } from "./dot-map";
import type { FunnelStep } from "./funnel-chart";
import type { HeatStripRow } from "./heat-strip";
import type { LineSeries } from "./line-chart";
import type { StackedSeries } from "./stacked-bar-chart";

function day(offset: number): string {
  const d = new Date(Date.UTC(2026, 7, 12 + offset));
  return d.toISOString().slice(0, 10);
}

const wave = (i: number, base: number, amp: number) =>
  Math.round(
    base + amp * Math.sin(i / 3.1) + (i % 7 === 5 || i % 7 === 6 ? -amp * 0.6 : 0) + (i % 5) * 4,
  );

export const FIXTURE_TIMESERIES: LineSeries[] = [
  {
    name: "Visitors",
    points: Array.from({ length: 30 }, (_, i) => ({ x: day(i), y: wave(i, 320, 90) })),
  },
  {
    name: "Previous period",
    points: Array.from({ length: 30 }, (_, i) => ({ x: day(i), y: wave(i + 4, 270, 70) })),
  },
];

export const FIXTURE_COUNTRIES: BarDatum[] = [
  { label: "India", value: 6120, hint: "51% of visitors" },
  { label: "United States", value: 1840, hint: "15%" },
  { label: "United Kingdom", value: 1105, hint: "9%" },
  { label: "United Arab Emirates", value: 980, hint: "8%" },
  { label: "Canada", value: 610, hint: "5%" },
  { label: "Australia", value: 455, hint: "4%" },
  { label: "Singapore", value: 300, hint: "3%" },
  { label: "Other", value: 590, hint: "5%" },
];

export const FIXTURE_WEEKS = [
  "2026-W28",
  "2026-W29",
  "2026-W30",
  "2026-W31",
  "2026-W32",
  "2026-W33",
];
export const FIXTURE_DEVICES: StackedSeries[] = [
  { name: "Mobile", values: [1520, 1610, 1490, 1720, 1810, 1905] },
  { name: "Desktop", values: [640, 690, 655, 720, 760, 790] },
  { name: "Tablet", values: [110, 95, 120, 105, 130, 125] },
];

export const FIXTURE_SCROLL: HeatStripRow[] = [
  { label: "/", reached: [0.92, 0.74, 0.55, 0.41, 0.3] },
  { label: "/astrology", reached: [0.88, 0.7, 0.52, 0.38, 0.27] },
  { label: "/vastu", reached: [0.9, 0.72, 0.5, 0.33, 0.22] },
  { label: "/astrologer/india/maharashtra/mumbai", reached: [0.85, 0.61, 0.44, 0.29, 0.18] },
  { label: "/services/integrated-life-reading", reached: [0.94, 0.8, 0.66, 0.5, 0.39] },
  { label: "/book", reached: [0.97, 0.9, 0.82, 0.7, 0.62] },
];

export const FIXTURE_FUNNEL: FunnelStep[] = [
  { label: "Booking started", count: 1240 },
  { label: "Service chosen", count: 930 },
  { label: "Slot chosen", count: 610 },
  { label: "Details entered", count: 402 },
  { label: "Booking completed", count: 318 },
];

export const FIXTURE_MAP: MapDot[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777, visitors: 1420 },
  { name: "Delhi", lat: 28.6139, lng: 77.209, visitors: 1180 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, visitors: 860 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, visitors: 720 },
  { name: "London", lat: 51.5072, lng: -0.1276, visitors: 690 },
  { name: "New York", lat: 40.7128, lng: -74.006, visitors: 540 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, visitors: 310 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, visitors: 260 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, visitors: 240 },
  { name: "Houston", lat: 29.7604, lng: -95.3698, visitors: 150 },
];

export const FIXTURE_STATS = [
  {
    label: "Visitors",
    value: "12,004",
    delta: 0.083,
    trend: [9, 11, 10, 12, 13, 12, 14, 15, 14, 16, 17, 18],
  },
  {
    label: "Sessions",
    value: "14,930",
    delta: 0.061,
    trend: [12, 13, 12, 14, 14, 15, 16, 16, 17, 18, 18, 19],
  },
  {
    label: "Pageviews",
    value: "41,208",
    delta: 0.114,
    trend: [30, 33, 31, 35, 36, 38, 39, 41, 40, 43, 44, 46],
  },
  {
    label: "Bounce rate",
    value: "38.2%",
    delta: -0.024,
    upIsGood: false,
    trend: [42, 41, 41, 40, 40, 39, 39, 39, 38, 38, 38, 38],
  },
  {
    label: "Avg. session",
    value: "2m 41s",
    delta: 0.052,
    trend: [140, 145, 150, 148, 152, 155, 158, 160, 159, 161, 163, 161],
  },
];

/** 40 columns × 24 rows (row-major), matching the raw-events heat grid; a hero CTA hot-spot, a nav hot-spot and a FAQ hot-spot. */
export const FIXTURE_HEAT = (() => {
  const cols = 40;
  const rows = 24;
  const cells: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hero = Math.exp(-((r - 6) ** 2) / 4 - (c - 10) ** 2 / 14) * 60;
      const nav = r === 0 && c >= 24 ? 18 - (c - 24) : 0;
      const faq = Math.exp(-((r - 18) ** 2) / 3 - (c - 19) ** 2 / 40) * 25;
      cells.push(Math.round(hero + nav + faq));
    }
  }
  return { cols, rows, cells, total: cells.reduce((a, b) => a + b, 0) };
})();
