/**
 * Dashboard query layer (Phase 5 contract). Server-only by construction — it imports the
 * database client — and never imported by client components. Every function reads
 * `analytics_daily_rollup` only; `getBehaviour` and `getRealtime` (raw tables, see
 * `raw-queries.ts`) are the two exceptions the contract allows.
 *
 * Conventions shared by every function:
 *  - `from` / `to` are inclusive UTC days (`YYYY-MM-DD`), as produced by `ranges.ts`.
 *  - `visitors` are daily unique visitors summed over the range: the visitor hash rotates every
 *    day by design, so a person seen on two days counts twice.
 *  - `options.db` injects a database (tests, PGlite); omitted, the app pool is used. Without a
 *    configured database every function resolves to an empty, zeroed result rather than
 *    throwing — the dashboard renders an honest "connect Supabase" state from
 *    `isAnalyticsConfigured()`.
 *  - The optional `geo` filter is honoured where the rollup can answer it (overview and
 *    timeseries read the matching country/region/city row); results say `geoFilterApplied`.
 */
import { and, countDistinct, desc, eq, sql } from "drizzle-orm";
import { analyticsDailyRollup as r, type AnalyticsDim } from "@/db/schema";
import { listGeoPages } from "@/lib/geo/pages";
import { resolveDb, type AnalyticsDb } from "./db";
import {
  dimRange,
  emptyRow,
  groupByKey,
  metricSelect,
  pct,
  shapeRow,
  sumKey,
  toNum,
  type MetricRow,
  type SortSpec,
} from "./metrics";
import { addDays, eachDay, previousPeriod, percentChange, type DateRange } from "./ranges";
import { cityKey, regionKey, SITE_KEY } from "./rollup";

export { isAnalyticsConfigured } from "./db";
export { getBehaviour, getRealtime } from "./raw-queries";
export type { BehaviourReport, RealtimeSnapshot } from "./raw-queries";
export type { MetricRow, SortSpec, SortableMetric } from "./metrics";
export { getAcquisition, getFunnel, getTechnology } from "./queries-conversions";
export type {
  Acquisition,
  ConversionRow,
  Funnel,
  FunnelStep,
  Technology,
} from "./queries-conversions";

export interface QueryOptions {
  db?: AnalyticsDb | null;
}

export interface GeoFilter {
  country?: string;
  region?: string;
  city?: string;
}

/** The rollup row a geo filter maps to; the whole site when no filter is set. */
export function geoTarget(geo?: GeoFilter): { dim: AnalyticsDim; key: string; applied: boolean } {
  if (geo?.country && geo.region && geo.city) {
    return { dim: "city", key: cityKey(geo.country, geo.region, geo.city), applied: true };
  }
  if (geo?.country && geo.region) {
    return { dim: "region", key: regionKey(geo.country, geo.region), applied: true };
  }
  if (geo?.country) return { dim: "country", key: geo.country.toUpperCase(), applied: true };
  return { dim: "site", key: SITE_KEY, applied: false };
}

export interface OverviewMetrics {
  visitors: number;
  sessions: number;
  pageviews: number;
  /** 0–100 */
  bounceRate: number;
  avgDurationMs: number;
  conversions: number;
}

export interface Overview {
  range: DateRange;
  current: OverviewMetrics;
  previousRange: DateRange | null;
  previous: OverviewMetrics | null;
  /** Percentage change per metric (`null` when the previous value was zero). */
  deltas: Record<keyof OverviewMetrics, number | null> | null;
  geoFilterApplied: boolean;
}

function toOverview(row: MetricRow): OverviewMetrics {
  return {
    visitors: row.visitors,
    sessions: row.sessions,
    pageviews: row.pageviews,
    bounceRate: row.bounceRate,
    avgDurationMs: row.avgDurationMs,
    conversions: row.conversions,
  };
}

const ZERO_OVERVIEW: OverviewMetrics = {
  visitors: 0,
  sessions: 0,
  pageviews: 0,
  bounceRate: 0,
  avgDurationMs: 0,
  conversions: 0,
};

export async function getOverview(
  params: DateRange & { compare: boolean; geo?: GeoFilter },
  options: QueryOptions = {},
): Promise<Overview> {
  const range = { from: params.from, to: params.to };
  const target = geoTarget(params.geo);
  const db = resolveDb(options.db);
  const previousRange = params.compare ? previousPeriod(range) : null;
  if (!db) {
    return {
      range,
      current: ZERO_OVERVIEW,
      previousRange,
      previous: previousRange ? ZERO_OVERVIEW : null,
      deltas: null,
      geoFilterApplied: target.applied,
    };
  }
  const current = toOverview(await sumKey(db, target.dim, target.key, range));
  const previous = previousRange
    ? toOverview(await sumKey(db, target.dim, target.key, previousRange))
    : null;
  const deltas = previous
    ? {
        visitors: percentChange(current.visitors, previous.visitors),
        sessions: percentChange(current.sessions, previous.sessions),
        pageviews: percentChange(current.pageviews, previous.pageviews),
        bounceRate: percentChange(current.bounceRate, previous.bounceRate),
        avgDurationMs: percentChange(current.avgDurationMs, previous.avgDurationMs),
        conversions: percentChange(current.conversions, previous.conversions),
      }
    : null;
  return { range, current, previousRange, previous, deltas, geoFilterApplied: target.applied };
}

/* ------------------------------------------------------------------------------------------ */

export type Granularity = "day" | "week" | "month";
export type TimeseriesMetric = keyof OverviewMetrics;

export interface TimeseriesPoint {
  /** `YYYY-MM-DD` of the day, ISO week's Monday, or the month's first day. */
  period: string;
  value: number;
}

function periodOf(day: string, granularity: Granularity): string {
  if (granularity === "day") return day;
  if (granularity === "month") return `${day.slice(0, 7)}-01`;
  const d = new Date(`${day}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(day, -offset);
}

export async function getTimeseries(
  params: DateRange & { granularity: Granularity; metric: TimeseriesMetric; geo?: GeoFilter },
  options: QueryOptions = {},
): Promise<TimeseriesPoint[]> {
  const target = geoTarget(params.geo);
  const periods = new Map<string, MetricRow[]>();
  for (const day of eachDay(params)) {
    const p = periodOf(day, params.granularity);
    if (!periods.has(p)) periods.set(p, []);
  }
  const db = resolveDb(options.db);
  if (db) {
    const rows = await db
      .select({ day: r.day, ...metricSelect() })
      .from(r)
      .where(and(dimRange(target.dim, params), eq(r.key, target.key)))
      .groupBy(r.day)
      .orderBy(r.day);
    for (const row of rows) {
      const p = periodOf(row.day, params.granularity);
      periods.get(p)?.push(shapeRow(target.dim, target.key, row));
    }
  }
  return [...periods.entries()].map(([period, rows]) => {
    const sums = rows.reduce(
      (acc, row) => ({
        visitors: acc.visitors + row.visitors,
        sessions: acc.sessions + row.sessions,
        pageviews: acc.pageviews + row.pageviews,
        bounces: acc.bounces + row.bounces,
        durationMsSum: acc.durationMsSum + row.durationMsSum,
        conversions: acc.conversions + row.conversions,
      }),
      { visitors: 0, sessions: 0, pageviews: 0, bounces: 0, durationMsSum: 0, conversions: 0 },
    );
    const value =
      params.metric === "bounceRate"
        ? pct(sums.bounces, sums.sessions)
        : params.metric === "avgDurationMs"
          ? Math.round(sums.sessions > 0 ? sums.durationMsSum / sums.sessions : 0)
          : sums[params.metric];
    return { period, value };
  });
}

/* ------------------------------------------------------------------------------------------ */

export interface Breakdown {
  dim: AnalyticsDim;
  rows: (MetricRow & { share: number })[];
  /** Distinct keys in the range (for pagination). */
  total: number;
  limit: number;
  offset: number;
  sort: SortSpec;
}

export async function getBreakdown(
  params: DateRange & { dim: AnalyticsDim; limit?: number; offset?: number; sort?: SortSpec },
  options: QueryOptions = {},
): Promise<Breakdown> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);
  const sort = params.sort ?? { by: "sessions", dir: "desc" };
  const db = resolveDb(options.db);
  if (!db) return { dim: params.dim, rows: [], total: 0, limit, offset, sort };
  const [rows, [count], site] = await Promise.all([
    groupByKey(db, params.dim, params, { limit, offset, sort }),
    db
      .select({ n: countDistinct(r.key) })
      .from(r)
      .where(dimRange(params.dim, params)),
    sumKey(db, "site", SITE_KEY, params),
  ]);
  const whole = params.dim === "path" || params.dim === "geo_page" ? site.pageviews : site.sessions;
  return {
    dim: params.dim,
    rows: rows.map((row) => ({
      ...row,
      share: pct(
        params.dim === "path" || params.dim === "geo_page" ? row.pageviews : row.sessions,
        whole,
      ),
    })),
    total: toNum(count?.n),
    limit,
    offset,
    sort,
  };
}

/* ------------------------------------------------------------------------------------------ */

export interface GeoRow extends MetricRow {
  country: string;
  region: string | null;
  city: string | null;
}

export interface GeoDrilldown {
  level: "country" | "region" | "city";
  country: string | null;
  region: string | null;
  rows: GeoRow[];
}

export async function getGeoDrilldown(
  params: DateRange & { country?: string; region?: string; sort?: SortSpec; limit?: number },
  options: QueryOptions = {},
): Promise<GeoDrilldown> {
  const country = params.country?.toUpperCase() ?? null;
  const region = country && params.region ? params.region : null;
  const level = region ? "city" : country ? "region" : "country";
  const db = resolveDb(options.db);
  if (!db) return { level, country, region, rows: [] };
  const dim: AnalyticsDim = level;
  const keyPrefix =
    level === "city" ? `${country}/${region}/` : level === "region" ? `${country}/` : undefined;
  const rows = await groupByKey(db, dim, params, {
    limit: params.limit ?? 200,
    sort: params.sort ?? { by: "visitors", dir: "desc" },
    keyPrefix,
  });
  return {
    level,
    country,
    region,
    rows: rows.map((row) => {
      const parts = row.key.split("/");
      return {
        ...row,
        country: parts[0] ?? row.key,
        region: level === "country" ? null : (parts[1] ?? null),
        city: level === "city" ? (parts[2] ?? null) : null,
      };
    }),
  };
}

/* ------------------------------------------------------------------------------------------ */

export type PagesKind = "top" | "entry" | "exit";

export interface PageRow extends MetricRow {
  path: string;
  /** exits / pageviews, 0–100. */
  exitRate: number;
  scroll: { depth: 25 | 50 | 75 | 90 | 100; count: number; pct: number }[];
}

export interface Pages {
  kind: PagesKind;
  rows: PageRow[];
  total: number;
  limit: number;
  offset: number;
}

function toPageRow(row: MetricRow): PageRow {
  const marks = [
    [25, row.scroll25],
    [50, row.scroll50],
    [75, row.scroll75],
    [90, row.scroll90],
    [100, row.scroll100],
  ] as const;
  return {
    ...row,
    path: row.key,
    exitRate: pct(row.exits, row.pageviews),
    scroll: marks.map(([depth, count]) => ({ depth, count, pct: pct(count, row.pageviews) })),
  };
}

export async function getPages(
  params: DateRange & { kind: PagesKind; limit?: number; offset?: number },
  options: QueryOptions = {},
): Promise<Pages> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);
  const db = resolveDb(options.db);
  if (!db) return { kind: params.kind, rows: [], total: 0, limit, offset };
  const orderCol =
    params.kind === "entry" ? r.entries : params.kind === "exit" ? r.exits : r.pageviews;
  const [rows, [count]] = await Promise.all([
    db
      .select({ key: r.key, ...metricSelect() })
      .from(r)
      .where(dimRange("path", params))
      .groupBy(r.key)
      .orderBy(desc(sql`sum(${orderCol})`), r.key)
      .limit(limit)
      .offset(offset),
    db
      .select({ n: countDistinct(r.key) })
      .from(r)
      .where(dimRange("path", params)),
  ]);
  return {
    kind: params.kind,
    rows: rows.map((row) => toPageRow(shapeRow("path", row.key, row))),
    total: toNum(count?.n),
    limit,
    offset,
  };
}

export interface ScrollDistribution {
  path: string;
  pageviews: number;
  buckets: PageRow["scroll"];
}

export async function getScrollDistribution(
  params: DateRange & { path: string },
  options: QueryOptions = {},
): Promise<ScrollDistribution> {
  const db = resolveDb(options.db);
  const row = db ? await sumKey(db, "path", params.path, params) : emptyRow("path", params.path);
  const page = toPageRow(row);
  return { path: params.path, pageviews: page.pageviews, buckets: page.scroll };
}

/* ------------------------------------------------------------------------------------------ */

export interface GeoPagePerformanceRow {
  href: string;
  service: "astrologer" | "vastu-consultant";
  locationName: string;
  locationPath: string;
  status: "complete" | "partial";
  pageviews: number;
  visitors: number;
  sessions: number;
  conversions: number;
  bookings: number;
  zeroTraffic: boolean;
}

export interface GeoPagePerformance {
  rows: GeoPagePerformanceRow[];
  totalPages: number;
  zeroTrafficPages: number;
}

export async function getGeoPagePerformance(
  params: DateRange,
  options: QueryOptions = {},
): Promise<GeoPagePerformance> {
  const db = resolveDb(options.db);
  const pages = await listGeoPages();
  const byHref = new Map<string, MetricRow>();
  if (db) {
    const rows = await groupByKey(db, "geo_page", params, {
      limit: 5000,
      sort: { by: "pageviews", dir: "desc" },
    });
    for (const row of rows) byHref.set(row.key, row);
  }
  const rows = pages
    .map((page): GeoPagePerformanceRow => {
      const m = byHref.get(page.href);
      return {
        href: page.href,
        service: page.service,
        locationName: page.location.name,
        locationPath: page.path,
        status: page.status,
        pageviews: m?.pageviews ?? 0,
        visitors: m?.visitors ?? 0,
        sessions: m?.sessions ?? 0,
        conversions: m?.conversions ?? 0,
        bookings: m?.bookings ?? 0,
        zeroTraffic: (m?.pageviews ?? 0) === 0,
      };
    })
    .sort((a, b) => b.pageviews - a.pageviews || a.href.localeCompare(b.href));
  return {
    rows,
    totalPages: rows.length,
    zeroTrafficPages: rows.filter((row) => row.zeroTraffic).length,
  };
}
