/**
 * Shared SQL fragments and row shaping for the rollup-backed queries. Every aggregate reads
 * `analytics_daily_rollup` only; sums are cast through `Number()` because Postgres returns
 * `bigint` sums as strings.
 */
import { and, between, eq, like, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { analyticsDailyRollup as r, type AnalyticsDim } from "@/db/schema";
import type { AnalyticsDb } from "./db";
import type { DateRange } from "./ranges";
import { DIRECT, UNKNOWN } from "./rollup";

/** Events that count as a conversion in tiles and rates (funnel steps are not conversions). */
export const CONVERSION_GOALS = [
  "booking_completed",
  "contact_submitted",
  "whatsapp_clicked",
  "call_clicked",
  "testimonial_submitted",
] as const;
export type ConversionGoal = (typeof CONVERSION_GOALS)[number];

export const SORTABLE_METRICS = [
  "pageviews",
  "visitors",
  "sessions",
  "bounceRate",
  "avgDurationMs",
  "conversions",
] as const;
export type SortableMetric = (typeof SORTABLE_METRICS)[number];

export interface SortSpec {
  by: SortableMetric;
  dir: "asc" | "desc";
}

/** Per-row metrics every breakdown, page and geo query returns. */
export interface MetricRow {
  key: string;
  /** Display label: last key segment for region/city keys, the key otherwise. */
  label: string;
  pageviews: number;
  visitors: number;
  sessions: number;
  bounces: number;
  /** bounces / sessions, 0–100. */
  bounceRate: number;
  durationMsSum: number;
  /** durationMsSum / sessions (session dims) — pages divide by pageviews instead. */
  avgDurationMs: number;
  entries: number;
  exits: number;
  scroll25: number;
  scroll50: number;
  scroll75: number;
  scroll90: number;
  scroll100: number;
  /** Sum of `CONVERSION_GOALS`. */
  conversions: number;
  /** conversions / sessions, 0–100. */
  conversionRate: number;
  /** Bookings completed. */
  bookings: number;
}

export const toNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const pct = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

export function jsonCount(name: string): SQL<number> {
  return sql<number>`coalesce((${r.conversions}->>${name})::int, 0)`;
}

export const goalsExpr: SQL<number> = sql<number>`(${sql.join(
  CONVERSION_GOALS.map((g) => jsonCount(g)),
  sql` + `,
)})`;

/** Column set for `select(...)` over rollup rows grouped by key (or over a single key). */
export function metricSelect() {
  const s = (c: SQL | AnyPgColumn) => sql<string>`coalesce(sum(${c}), 0)`;
  return {
    pageviews: s(r.pageviews),
    visitors: s(r.visitors),
    sessions: s(r.sessions),
    bounces: s(r.bounces),
    durationMsSum: s(r.durationMsSum),
    entries: s(r.entries),
    exits: s(r.exits),
    scroll25: s(r.scroll25),
    scroll50: s(r.scroll50),
    scroll75: s(r.scroll75),
    scroll90: s(r.scroll90),
    scroll100: s(r.scroll100),
    conversions: s(goalsExpr),
    bookings: s(jsonCount("booking_completed")),
  };
}

export type RawMetricRow = { [K in keyof ReturnType<typeof metricSelect>]: unknown };

export function labelFor(dim: AnalyticsDim, key: string): string {
  if (dim === "region" || dim === "city") return key.split("/").pop() || key;
  if (key === DIRECT) return "Direct / none";
  if (key === UNKNOWN) return "Unknown";
  return key;
}

export function shapeRow(dim: AnalyticsDim, key: string, raw: RawMetricRow): MetricRow {
  const sessions = toNum(raw.sessions);
  const pageviews = toNum(raw.pageviews);
  const bounces = toNum(raw.bounces);
  const durationMsSum = toNum(raw.durationMsSum);
  const conversions = toNum(raw.conversions);
  const perPage = dim === "path" || dim === "geo_page";
  return {
    key,
    label: labelFor(dim, key),
    pageviews,
    visitors: toNum(raw.visitors),
    sessions,
    bounces,
    bounceRate: pct(bounces, perPage ? toNum(raw.entries) : sessions),
    durationMsSum,
    avgDurationMs: perPage
      ? Math.round(pageviews > 0 ? durationMsSum / pageviews : 0)
      : Math.round(sessions > 0 ? durationMsSum / sessions : 0),
    entries: toNum(raw.entries),
    exits: toNum(raw.exits),
    scroll25: toNum(raw.scroll25),
    scroll50: toNum(raw.scroll50),
    scroll75: toNum(raw.scroll75),
    scroll90: toNum(raw.scroll90),
    scroll100: toNum(raw.scroll100),
    conversions,
    conversionRate: pct(conversions, sessions),
    bookings: toNum(raw.bookings),
  };
}

export function emptyRow(dim: AnalyticsDim, key: string): MetricRow {
  return shapeRow(dim, key, {
    pageviews: 0,
    visitors: 0,
    sessions: 0,
    bounces: 0,
    durationMsSum: 0,
    entries: 0,
    exits: 0,
    scroll25: 0,
    scroll50: 0,
    scroll75: 0,
    scroll90: 0,
    scroll100: 0,
    conversions: 0,
    bookings: 0,
  });
}

export function dimRange(dim: AnalyticsDim, range: DateRange): SQL {
  return and(eq(r.dim, dim), between(r.day, range.from, range.to)) as SQL;
}

/** ORDER BY for a sortable metric, computed on the aggregated columns. */
export function orderFor(sort: SortSpec): SQL {
  const dir = sort.dir === "asc" ? sql`asc` : sql`desc`;
  const expr: Record<SortableMetric, SQL> = {
    pageviews: sql`sum(${r.pageviews})`,
    visitors: sql`sum(${r.visitors})`,
    sessions: sql`sum(${r.sessions})`,
    bounceRate: sql`(sum(${r.bounces})::float / nullif(sum(${r.sessions}), 0))`,
    avgDurationMs: sql`(sum(${r.durationMsSum})::float / nullif(sum(${r.sessions}), 0))`,
    conversions: sql`sum(${goalsExpr})`,
  };
  return sql`${expr[sort.by]} ${dir} nulls last, ${r.key} asc`;
}

/** Escape `%` and `_` so a key prefix can be used in LIKE. */
export function likePrefix(prefix: string): string {
  return `${prefix.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Sum the rows of one (dim, key) over a range. */
export async function sumKey(db: AnalyticsDb, dim: AnalyticsDim, key: string, range: DateRange) {
  const [row] = await db
    .select(metricSelect())
    .from(r)
    .where(and(dimRange(dim, range), eq(r.key, key)));
  return shapeRow(dim, key, row ?? emptyRow(dim, key));
}

export async function groupByKey(
  db: AnalyticsDb,
  dim: AnalyticsDim,
  range: DateRange,
  opts: { limit?: number; offset?: number; sort?: SortSpec; keyPrefix?: string } = {},
): Promise<MetricRow[]> {
  const where = opts.keyPrefix
    ? and(dimRange(dim, range), like(r.key, likePrefix(opts.keyPrefix)))
    : dimRange(dim, range);
  const q = db
    .select({ key: r.key, ...metricSelect() })
    .from(r)
    .where(where)
    .groupBy(r.key)
    .orderBy(orderFor(opts.sort ?? { by: "sessions", dir: "desc" }))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  const rows = await q;
  return rows.map((row) => shapeRow(dim, row.key, row));
}
