/**
 * The two dashboard reads that touch raw tables (contract: "ALL reads from rollups except
 * realtime" — behaviour heat points need click coordinates, which rollups do not keep).
 * Both are bounded: realtime looks at the last five minutes, behaviour at the retention window.
 */
import { and, between, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { analyticsEvents as e, analyticsSessions as s } from "@/db/schema";
import { RAW_RETENTION_DAYS, resolveDb, type AnalyticsDb } from "./db";
import { toNum } from "./metrics";
import type { DateRange } from "./ranges";
import { dayBounds } from "./rollup";

export const HEAT_COLS = 40;
export const HEAT_ROWS = 24;

export interface HeatGrid {
  cols: number;
  rows: number;
  /** Row-major counts, length `cols * rows`. */
  cells: number[];
  max: number;
  total: number;
}

export interface ClickTarget {
  selector: string;
  text: string;
  count: number;
}

export interface BehaviourReport {
  path: string | null;
  range: DateRange;
  retentionDays: number;
  clicks: number;
  rageClicks: number;
  deadClicks: number;
  formAbandons: number;
  heat: HeatGrid;
  topRage: ClickTarget[];
  topDead: ClickTarget[];
}

interface QueryOptions {
  db?: AnalyticsDb | null;
}

function emptyHeat(): HeatGrid {
  return {
    cols: HEAT_COLS,
    rows: HEAT_ROWS,
    cells: new Array(HEAT_COLS * HEAT_ROWS).fill(0),
    max: 0,
    total: 0,
  };
}

export async function getBehaviour(
  params: DateRange & { path?: string | null },
  options: QueryOptions = {},
): Promise<BehaviourReport> {
  const db = resolveDb(options.db);
  const path = params.path?.trim() || null;
  const report: BehaviourReport = {
    path,
    range: { from: params.from, to: params.to },
    retentionDays: RAW_RETENTION_DAYS,
    clicks: 0,
    rageClicks: 0,
    deadClicks: 0,
    formAbandons: 0,
    heat: emptyHeat(),
    topRage: [],
    topDead: [],
  };
  if (!db) return report;

  const start = dayBounds(params.from).start;
  const end = dayBounds(params.to).end;
  const scope = and(
    between(e.occurredAt, start, new Date(end.getTime() - 1)),
    inArray(e.name, ["click", "rage_click", "dead_click", "form_abandon"]),
    eq(s.isBot, false),
    ...(path ? [eq(e.path, path)] : []),
  );
  const counts = await db
    .select({ name: e.name, n: sql<string>`count(*)` })
    .from(e)
    .innerJoin(s, eq(e.sessionId, s.id))
    .where(scope)
    .groupBy(e.name);
  for (const row of counts) {
    const n = toNum(row.n);
    if (row.name === "click") report.clicks = n;
    else if (row.name === "rage_click") report.rageClicks = n;
    else if (row.name === "dead_click") report.deadClicks = n;
    else if (row.name === "form_abandon") report.formAbandons = n;
  }

  // Constants are inlined: a parameter in SELECT and GROUP BY would be two different expressions.
  const col = sql<string>`least(${sql.raw(String(HEAT_COLS - 1))}, greatest(0, floor(coalesce((${e.props}->>'x')::float, 0) / 100 * ${sql.raw(String(HEAT_COLS))})))::int`;
  const row = sql<string>`least(${sql.raw(String(HEAT_ROWS - 1))}, greatest(0, floor(coalesce((${e.props}->>'y')::float, 0) / 100 * ${sql.raw(String(HEAT_ROWS))})))::int`;
  const heat = await db
    .select({ col, row, n: sql<string>`count(*)` })
    .from(e)
    .innerJoin(s, eq(e.sessionId, s.id))
    .where(and(scope, eq(e.name, "click")))
    .groupBy(col, row);
  for (const cell of heat) {
    const index = toNum(cell.row) * HEAT_COLS + toNum(cell.col);
    const n = toNum(cell.n);
    if (index >= 0 && index < report.heat.cells.length) {
      report.heat.cells[index] = n;
      report.heat.total += n;
      report.heat.max = Math.max(report.heat.max, n);
    }
  }

  const targets = async (name: "rage_click" | "dead_click"): Promise<ClickTarget[]> => {
    const sel = sql<string>`coalesce(${e.props}->>'sel', '')`;
    const txt = sql<string>`coalesce(${e.props}->>'txt', '')`;
    const rows = await db
      .select({ sel, txt, n: sql<string>`count(*)` })
      .from(e)
      .innerJoin(s, eq(e.sessionId, s.id))
      .where(and(scope, eq(e.name, name)))
      .groupBy(sel, txt)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
    return rows.map((r) => ({ selector: r.sel, text: r.txt, count: toNum(r.n) }));
  };
  [report.topRage, report.topDead] = await Promise.all([
    targets("rage_click"),
    targets("dead_click"),
  ]);
  return report;
}

/* ------------------------------------------------------------------------------------------ */

export interface ActiveSession {
  path: string;
  country: string | null;
  city: string | null;
  device: string | null;
  referrerHost: string | null;
  secondsOnSite: number;
  pageviews: number;
  startedAt: string;
  lastSeenAt: string;
}

export interface RealtimeEvent {
  name: string;
  path: string;
  occurredAt: string;
  props: Record<string, string | number | boolean | null>;
  country: string | null;
  device: string | null;
}

export interface RealtimeSnapshot {
  generatedAt: string;
  windowSeconds: number;
  activeSessions: ActiveSession[];
  events: RealtimeEvent[];
}

export const REALTIME_WINDOW_SECONDS = 5 * 60;

export async function getRealtime(
  options: QueryOptions & { now?: Date } = {},
): Promise<RealtimeSnapshot> {
  const now = options.now ?? new Date();
  const db = resolveDb(options.db);
  const snapshot: RealtimeSnapshot = {
    generatedAt: now.toISOString(),
    windowSeconds: REALTIME_WINDOW_SECONDS,
    activeSessions: [],
    events: [],
  };
  if (!db) return snapshot;
  const since = new Date(now.getTime() - REALTIME_WINDOW_SECONDS * 1000);
  const sessions = await db
    .select()
    .from(s)
    .where(and(gte(s.lastSeenAt, since), eq(s.isBot, false)))
    .orderBy(desc(s.lastSeenAt))
    .limit(200);
  snapshot.activeSessions = sessions.map((row) => ({
    path: row.exitPath ?? row.entryPath,
    country: row.country,
    city: row.city,
    device: row.deviceType,
    referrerHost: row.referrerHost,
    secondsOnSite: Math.max(
      0,
      Math.round((row.lastSeenAt.getTime() - row.startedAt.getTime()) / 1000),
    ),
    pageviews: row.pageviewCount,
    startedAt: row.startedAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  }));
  const events = await db
    .select({ ev: e, country: s.country, device: s.deviceType })
    .from(e)
    .innerJoin(s, eq(e.sessionId, s.id))
    .where(and(gte(e.occurredAt, since), eq(s.isBot, false)))
    .orderBy(desc(e.occurredAt))
    .limit(50);
  snapshot.events = events.map(({ ev, country, device }) => ({
    name: ev.name,
    path: ev.path,
    occurredAt: ev.occurredAt.toISOString(),
    props: ev.props,
    country,
    device,
  }));
  return snapshot;
}
