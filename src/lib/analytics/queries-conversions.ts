/**
 * Acquisition, technology and conversion-funnel queries — the rollup-backed half of the
 * dashboard that `queries.ts` re-exports. Same conventions as `queries.ts` (inclusive UTC days,
 * optional injected `db`, empty results without a database).
 */
import { resolveDb } from "./db";
import { emptyRow, groupByKey, pct, toNum, type MetricRow } from "./metrics";
import type { QueryOptions } from "./queries";
import type { DateRange } from "./ranges";
import { AI_REFERRER_HOSTS, isAiReferrer, isSearchEngine, isSocial } from "./referrer";
import { DIRECT } from "./rollup";

export interface Acquisition {
  channels: MetricRow[];
  referrers: MetricRow[];
  searchEngines: MetricRow[];
  social: MetricRow[];
  /** Every known AI assistant host, zero-filled, so the panel always lists them. */
  ai: MetricRow[];
  direct: MetricRow;
  campaigns: MetricRow[];
}

export async function getAcquisition(
  params: DateRange,
  options: QueryOptions = {},
): Promise<Acquisition> {
  const db = resolveDb(options.db);
  const empty: Acquisition = {
    channels: [],
    referrers: [],
    searchEngines: [],
    social: [],
    ai: AI_REFERRER_HOSTS.map((h) => emptyRow("referrer", h)),
    direct: emptyRow("referrer", DIRECT),
    campaigns: [],
  };
  if (!db) return empty;
  const [channels, referrers, campaigns] = await Promise.all([
    groupByKey(db, "source", params, { limit: 10 }),
    groupByKey(db, "referrer", params, { limit: 500 }),
    groupByKey(db, "utm_campaign", params, { limit: 50 }),
  ]);
  const byHost = new Map(referrers.map((row) => [row.key, row]));
  return {
    channels,
    referrers: referrers.filter((row) => row.key !== DIRECT).slice(0, 25),
    searchEngines: referrers.filter((row) => isSearchEngine(row.key)),
    social: referrers.filter((row) => isSocial(row.key)),
    ai: [
      ...AI_REFERRER_HOSTS.map((h) => byHost.get(h) ?? emptyRow("referrer", h)),
      ...referrers.filter(
        (row) =>
          isAiReferrer(row.key) && !(AI_REFERRER_HOSTS as readonly string[]).includes(row.key),
      ),
    ].sort((a, b) => b.sessions - a.sessions),
    direct: byHost.get(DIRECT) ?? empty.direct,
    campaigns,
  };
}

/* ------------------------------------------------------------------------------------------ */

export interface Technology {
  devices: MetricRow[];
  os: MetricRow[];
  browsers: MetricRow[];
  screens: MetricRow[];
  connections: MetricRow[];
}

export async function getTechnology(
  params: DateRange,
  options: QueryOptions = {},
): Promise<Technology> {
  const db = resolveDb(options.db);
  if (!db) return { devices: [], os: [], browsers: [], screens: [], connections: [] };
  const [devices, os, browsers, screens, connections] = await Promise.all([
    groupByKey(db, "device", params, { limit: 10 }),
    groupByKey(db, "os", params, { limit: 10 }),
    groupByKey(db, "browser", params, { limit: 10 }),
    groupByKey(db, "screen", params, { limit: 20 }),
    groupByKey(db, "connection", params, { limit: 10 }),
  ]);
  return { devices, os, browsers, screens, connections };
}

/* ------------------------------------------------------------------------------------------ */

export interface FunnelStep {
  key: string;
  label: string;
  sessions: number;
  /** Sessions lost since the previous step. */
  dropOff: number;
  /** 0–100 of the previous step. */
  dropOffRate: number;
  /** 0–100 of the first step. */
  reachRate: number;
}

export interface ConversionRow {
  key: string;
  label: string;
  sessions: number;
  bookings: number;
  conversions: number;
  /** bookings / sessions, 0–100. */
  bookingRate: number;
  /** conversions / sessions, 0–100. */
  conversionRate: number;
}

export interface Funnel {
  steps: FunnelStep[];
  /** completed / started, 0–100. */
  conversionRate: number;
  byPage: ConversionRow[];
  byCountry: ConversionRow[];
  byDevice: ConversionRow[];
  bySource: ConversionRow[];
  contactSubmitted: number;
  whatsappClicked: number;
  callClicked: number;
  testimonialSubmitted: number;
}

function stepOrder(key: string): number {
  if (key === "started") return 0;
  if (key === "completed") return 1_000;
  const n = Number(key.split(":")[1]);
  return Number.isFinite(n) ? n : 500;
}

function stepLabel(key: string): string {
  if (key === "started") return "Booking started";
  if (key === "completed") return "Booking completed";
  return `Step ${key.split(":")[1] ?? "?"}`;
}

function toConversionRow(row: MetricRow): ConversionRow {
  return {
    key: row.key,
    label: row.label,
    sessions: row.sessions,
    bookings: row.bookings,
    conversions: row.conversions,
    bookingRate: pct(row.bookings, row.sessions),
    conversionRate: row.conversionRate,
  };
}

export async function getFunnel(params: DateRange, options: QueryOptions = {}): Promise<Funnel> {
  const db = resolveDb(options.db);
  const empty: Funnel = {
    steps: [],
    conversionRate: 0,
    byPage: [],
    byCountry: [],
    byDevice: [],
    bySource: [],
    contactSubmitted: 0,
    whatsappClicked: 0,
    callClicked: 0,
    testimonialSubmitted: 0,
  };
  if (!db) return empty;
  const [stepRows, events, byPage, byCountry, byDevice, bySource] = await Promise.all([
    groupByKey(db, "funnel_step", params, { limit: 50 }),
    groupByKey(db, "event", params, { limit: 50 }),
    groupByKey(db, "path", params, { limit: 25, sort: { by: "conversions", dir: "desc" } }),
    groupByKey(db, "country", params, { limit: 25, sort: { by: "conversions", dir: "desc" } }),
    groupByKey(db, "device", params, { limit: 10, sort: { by: "conversions", dir: "desc" } }),
    groupByKey(db, "source", params, { limit: 10, sort: { by: "conversions", dir: "desc" } }),
  ]);
  const ordered = [...stepRows].sort((a, b) => stepOrder(a.key) - stepOrder(b.key));
  const first = ordered[0]?.sessions ?? 0;
  const steps = ordered.map((row, i): FunnelStep => {
    const prev = i === 0 ? row.sessions : (ordered[i - 1]?.sessions ?? 0);
    const dropOff = Math.max(0, prev - row.sessions);
    return {
      key: row.key,
      label: stepLabel(row.key),
      sessions: row.sessions,
      dropOff,
      dropOffRate: pct(dropOff, prev),
      reachRate: pct(row.sessions, first),
    };
  });
  const completed = ordered.find((row) => row.key === "completed")?.sessions ?? 0;
  const eventCount = (name: string) => {
    const row = events.find((e) => e.key === name);
    return row ? toNum(row.conversions) || row.sessions : 0;
  };
  return {
    steps,
    conversionRate: pct(completed, first),
    byPage: byPage.filter((row) => row.conversions > 0).map(toConversionRow),
    byCountry: byCountry.map(toConversionRow),
    byDevice: byDevice.map(toConversionRow),
    bySource: bySource.map(toConversionRow),
    contactSubmitted: eventCount("contact_submitted"),
    whatsappClicked: eventCount("whatsapp_clicked"),
    callClicked: eventCount("call_clicked"),
    testimonialSubmitted: eventCount("testimonial_submitted"),
  };
}
