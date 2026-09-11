/**
 * Daily rollup: raw sessions, pageviews and events → identifier-free rows in
 * `analytics_daily_rollup`, one per (day, dim, key). A session belongs to the UTC day it
 * started; everything it did counts on that day. Bot sessions are skipped. The whole day is
 * recomputed in memory (a day of raw data for this site is thousands of rows, not millions)
 * and upserted, so re-running is idempotent. Retention: raw rows older than
 * `RAW_RETENTION_DAYS` are deleted; rollups are kept forever.
 */
import { and, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import {
  ANALYTICS_EVENT_NAMES,
  analyticsDailyRollup,
  analyticsEvents,
  analyticsPageviews,
  analyticsSessions,
  type AnalyticsDim,
  type NewAnalyticsDailyRollup,
  type TrackedEventName,
} from "@/db/schema";
import { RAW_RETENTION_DAYS, type AnalyticsDb } from "./db";
import { utcDay } from "./hash";
import { isGeoPagePath } from "./paths";

export const UNKNOWN = "(unknown)";
export const DIRECT = "(direct)";
export const SITE_KEY = "all";

interface Bucket {
  dim: AnalyticsDim;
  key: string;
  pageviews: number;
  visitors: Set<string>;
  sessions: Set<string>;
  bounces: number;
  durationMsSum: number;
  entries: number;
  exits: number;
  scroll: [number, number, number, number, number];
  conversions: Partial<Record<TrackedEventName, number>>;
}

const CONVERSION_NAMES = new Set<string>(ANALYTICS_EVENT_NAMES);
const MARKS = [25, 50, 75, 90, 100] as const;

export function dayBounds(day: string): { start: Date; end: Date } {
  const start = new Date(`${day}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function regionKey(country: string | null, region: string | null): string {
  return `${country ?? UNKNOWN}/${region ?? UNKNOWN}`;
}

export function cityKey(
  country: string | null,
  region: string | null,
  city: string | null,
): string {
  return `${regionKey(country, region)}/${city ?? UNKNOWN}`;
}

export function funnelStepKey(
  name: TrackedEventName,
  props: Record<string, unknown>,
): string | null {
  if (name === "booking_started") return "started";
  if (name === "booking_completed") return "completed";
  if (name === "booking_step") {
    const step = Number(props.step);
    return Number.isFinite(step) && step > 0 ? `step:${Math.round(step)}` : null;
  }
  return null;
}

class Aggregator {
  private buckets = new Map<string, Bucket>();

  get(dim: AnalyticsDim, key: string): Bucket {
    const id = `${dim}|${key}`;
    let bucket = this.buckets.get(id);
    if (!bucket) {
      bucket = {
        dim,
        key,
        pageviews: 0,
        visitors: new Set(),
        sessions: new Set(),
        bounces: 0,
        durationMsSum: 0,
        entries: 0,
        exits: 0,
        scroll: [0, 0, 0, 0, 0],
        conversions: {},
      };
      this.buckets.set(id, bucket);
    }
    return bucket;
  }

  rows(day: string): NewAnalyticsDailyRollup[] {
    return [...this.buckets.values()].map((b) => ({
      day,
      dim: b.dim,
      key: b.key.slice(0, 512),
      pageviews: b.pageviews,
      visitors: b.visitors.size,
      sessions: b.sessions.size,
      bounces: b.bounces,
      durationMsSum: b.durationMsSum,
      entries: b.entries,
      exits: b.exits,
      scroll25: b.scroll[0],
      scroll50: b.scroll[1],
      scroll75: b.scroll[2],
      scroll90: b.scroll[3],
      scroll100: b.scroll[4],
      conversions: b.conversions,
    }));
  }
}

function addScroll(bucket: Bucket, depth: number) {
  MARKS.forEach((m, i) => {
    if (depth >= m) bucket.scroll[i] = (bucket.scroll[i] ?? 0) + 1;
  });
}

function addConversion(bucket: Bucket, name: TrackedEventName) {
  bucket.conversions[name] = (bucket.conversions[name] ?? 0) + 1;
}

export type RawSession = typeof analyticsSessions.$inferSelect;
export type RawPageview = typeof analyticsPageviews.$inferSelect;
export type RawEvent = typeof analyticsEvents.$inferSelect;

/**
 * Pure aggregation of one day's raw rows into rollup rows. Shared by the cron (`computeDay`)
 * and the analytics seed, so seeded history and real history mean exactly the same thing.
 * Pageviews must be ordered by `occurredAt` within a session.
 */
export function aggregateDay(
  day: string,
  sessions: RawSession[],
  pageviews: RawPageview[],
  events: RawEvent[],
): NewAnalyticsDailyRollup[] {
  const pvBySession = new Map<string, RawPageview[]>();
  for (const pv of pageviews) {
    const list = pvBySession.get(pv.sessionId) ?? [];
    list.push(pv);
    pvBySession.set(pv.sessionId, list);
  }
  const evBySession = new Map<string, RawEvent[]>();
  for (const ev of events) {
    if (!ev.sessionId) continue;
    const list = evBySession.get(ev.sessionId) ?? [];
    list.push(ev);
    evBySession.set(ev.sessionId, list);
  }

  const agg = new Aggregator();
  for (const s of sessions) {
    if (s.isBot) continue;
    const pvs = pvBySession.get(s.id) ?? [];
    const evs = evBySession.get(s.id) ?? [];
    const pvCount = pvs.length;
    const bounced = pvCount <= 1;
    const conversions = evs.filter((e) => CONVERSION_NAMES.has(e.name));
    const sessionKeys: [AnalyticsDim, string | null][] = [
      ["site", SITE_KEY],
      ["country", s.country ?? UNKNOWN],
      ["region", regionKey(s.country, s.region)],
      ["city", cityKey(s.country, s.region, s.city)],
      ["device", s.deviceType ?? UNKNOWN],
      ["os", s.os ?? UNKNOWN],
      ["browser", s.browser ?? UNKNOWN],
      ["referrer", s.referrerHost ?? DIRECT],
      ["source", s.channel ?? "direct"],
      ["utm_campaign", s.utmCampaign],
      ["screen", s.screenW && s.screenH ? `${s.screenW}x${s.screenH}` : null],
      ["connection", s.connection],
    ];
    for (const [dim, key] of sessionKeys) {
      if (key === null) continue;
      const b = agg.get(dim, key);
      b.sessions.add(s.id);
      b.visitors.add(s.visitorHash);
      b.pageviews += pvCount;
      b.bounces += bounced ? 1 : 0;
      b.durationMsSum += s.durationMs;
      b.entries += 1;
      b.exits += 1;
      for (const pv of pvs) addScroll(b, pv.scrollDepthMax);
      for (const e of conversions) addConversion(b, e.name);
    }

    pvs.forEach((pv, index) => {
      const isEntry = index === 0;
      const isExit = index === pvs.length - 1;
      const dims: AnalyticsDim[] = isGeoPagePath(pv.path) ? ["path", "geo_page"] : ["path"];
      for (const dim of dims) {
        const b = agg.get(dim, pv.path);
        b.pageviews += 1;
        b.sessions.add(s.id);
        b.visitors.add(s.visitorHash);
        b.entries += isEntry ? 1 : 0;
        b.exits += isExit ? 1 : 0;
        b.bounces += isEntry && bounced ? 1 : 0;
        b.durationMsSum += pv.timeOnPageMs ?? pv.durationMs ?? 0;
        addScroll(b, pv.scrollDepthMax);
        for (const e of conversions) if (e.path === pv.path) addConversion(b, e.name);
      }
    });

    const funnelSeen = new Set<string>();
    for (const e of evs) {
      const b = agg.get("event", e.name);
      b.sessions.add(s.id);
      b.visitors.add(s.visitorHash);
      addConversion(b, e.name);
      const step = funnelStepKey(e.name, e.props);
      if (step && !funnelSeen.has(step)) {
        funnelSeen.add(step);
        const f = agg.get("funnel_step", step);
        f.sessions.add(s.id);
        f.visitors.add(s.visitorHash);
        addConversion(f, e.name);
      }
    }
  }
  return agg.rows(day);
}

/** Compute the rollup rows for one UTC day from raw data, without writing. */
export async function computeDay(db: AnalyticsDb, day: string): Promise<NewAnalyticsDailyRollup[]> {
  const { start, end } = dayBounds(day);
  const sessionWhere = and(
    gte(analyticsSessions.startedAt, start),
    lt(analyticsSessions.startedAt, end),
    eq(analyticsSessions.isBot, false),
  );
  const sessions = await db.select().from(analyticsSessions).where(sessionWhere);
  if (sessions.length === 0) return [];
  const pageviews = await db
    .select({ pv: analyticsPageviews })
    .from(analyticsPageviews)
    .innerJoin(analyticsSessions, eq(analyticsPageviews.sessionId, analyticsSessions.id))
    .where(sessionWhere)
    .orderBy(analyticsPageviews.occurredAt);
  const events = await db
    .select({ ev: analyticsEvents })
    .from(analyticsEvents)
    .innerJoin(analyticsSessions, eq(analyticsEvents.sessionId, analyticsSessions.id))
    .where(sessionWhere);
  return aggregateDay(
    day,
    sessions,
    pageviews.map((row) => row.pv),
    events.map((row) => row.ev),
  );
}

/** Upsert a day's rows in chunks; returns the number of rows written. */
export async function writeRollup(
  db: AnalyticsDb,
  rows: NewAnalyticsDailyRollup[],
): Promise<number> {
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db
      .insert(analyticsDailyRollup)
      .values(chunk)
      .onConflictDoUpdate({
        target: [analyticsDailyRollup.day, analyticsDailyRollup.dim, analyticsDailyRollup.key],
        set: {
          pageviews: sql`excluded.pageviews`,
          visitors: sql`excluded.visitors`,
          sessions: sql`excluded.sessions`,
          bounces: sql`excluded.bounces`,
          durationMsSum: sql`excluded.duration_ms_sum`,
          entries: sql`excluded.entries`,
          exits: sql`excluded.exits`,
          scroll25: sql`excluded.scroll_25`,
          scroll50: sql`excluded.scroll_50`,
          scroll75: sql`excluded.scroll_75`,
          scroll90: sql`excluded.scroll_90`,
          scroll100: sql`excluded.scroll_100`,
          conversions: sql`excluded.conversions`,
        },
      });
  }
  return rows.length;
}

export async function rollupDay(db: AnalyticsDb, day: string): Promise<number> {
  const rows = await computeDay(db, day);
  return writeRollup(db, rows);
}

/** Days with raw (non-bot) sessions and no `site` rollup row yet, oldest first. */
export async function daysAwaitingRollup(db: AnalyticsDb): Promise<string[]> {
  const rolled = db
    .select({ day: sql<string>`${analyticsDailyRollup.day}::text` })
    .from(analyticsDailyRollup)
    .where(eq(analyticsDailyRollup.dim, "site"));
  const dayExpr = sql<string>`to_char(${analyticsSessions.startedAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day: dayExpr })
    .from(analyticsSessions)
    .where(and(eq(analyticsSessions.isBot, false), sql`${dayExpr} not in (${rolled})`))
    .groupBy(dayExpr)
    .orderBy(dayExpr);
  return rows.map((r) => r.day);
}

export interface RetentionResult {
  sessionsDeleted: number;
  orphanEventsDeleted: number;
}

/** Delete raw rows older than the retention window (pageviews and events cascade). */
export async function applyRetention(
  db: AnalyticsDb,
  now: Date,
  retentionDays = RAW_RETENTION_DAYS,
): Promise<RetentionResult> {
  const cutoff = new Date(now.getTime() - retentionDays * 86_400_000);
  const sessions = await db
    .delete(analyticsSessions)
    .where(lt(analyticsSessions.startedAt, cutoff))
    .returning({ id: analyticsSessions.id });
  const orphans = await db
    .delete(analyticsEvents)
    .where(and(isNull(analyticsEvents.sessionId), lt(analyticsEvents.occurredAt, cutoff)))
    .returning({ id: analyticsEvents.id });
  return { sessionsDeleted: sessions.length, orphanEventsDeleted: orphans.length };
}

export interface RollupRunResult {
  days: string[];
  rows: number;
  retention: RetentionResult;
}

/**
 * The cron body: today and yesterday (late beacons), plus every older day that has raw data
 * but no rollup yet, then retention. Yesterday is always recomputed so nothing is missed when a
 * run fails.
 */
export async function runRollup(db: AnalyticsDb, now: Date = new Date()): Promise<RollupRunResult> {
  const today = utcDay(now);
  const yesterday = utcDay(new Date(now.getTime() - 86_400_000));
  const pending = await daysAwaitingRollup(db);
  const days = [...new Set([...pending, yesterday, today])].sort();
  let rows = 0;
  for (const day of days) rows += await rollupDay(db, day);
  const retention = await applyRetention(db, now);
  return { days, rows, retention };
}

/** Sessions of the given ids — used by tests to assert cascade deletes. */
export async function sessionsExist(db: AnalyticsDb, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await db
    .select({ id: analyticsSessions.id })
    .from(analyticsSessions)
    .where(inArray(analyticsSessions.id, ids));
  return rows.length;
}
