/**
 * Consent-log and CAPI-log summaries for the admin (CLAUDE.md §13C/E). Read-only aggregates:
 * how many visitors accepted or rejected advertising cookies, by day and by region, and what
 * the Conversions API actually sent. Nothing here returns an identity — `visitor_id` is the
 * same anonymous daily hash the cookieless analytics uses and is never selected.
 */
import { desc, gte, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import { capiLog, consentLog } from "@/db/schema/integrations";

export type LogDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface ConsentSummary {
  total: number;
  accepted: number;
  rejected: number;
  byDay: { day: string; accepted: number; rejected: number }[];
  byRegion: { region: string; accepted: number; rejected: number }[];
}

export const EMPTY_CONSENT_SUMMARY: ConsentSummary = {
  total: 0,
  accepted: 0,
  rejected: 0,
  byDay: [],
  byRegion: [],
};

function since(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

/** Choices recorded in the last `days` days, grouped for the two small tables on the screen. */
export async function getConsentSummary(days = 30, db?: LogDb | null): Promise<ConsentSummary> {
  const database = db === undefined ? getDb() : db;
  if (!database) return EMPTY_CONSENT_SUMMARY;
  const accepted = sql<number>`count(*) filter (where ${consentLog.choices}->>'marketing' = 'true')`;
  const rejected = sql<number>`count(*) filter (where ${consentLog.choices}->>'marketing' <> 'true')`;

  const [days_, regions] = await Promise.all([
    database
      .select({
        day: sql<string>`to_char(${consentLog.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        accepted,
        rejected,
      })
      .from(consentLog)
      .where(gte(consentLog.createdAt, since(days)))
      .groupBy(sql`1`)
      .orderBy(sql`1 desc`)
      .limit(days),
    database
      .select({
        region: sql<string>`coalesce(${consentLog.region}, 'unknown')`,
        accepted,
        rejected,
      })
      .from(consentLog)
      .where(gte(consentLog.createdAt, since(days)))
      .groupBy(sql`1`)
      .orderBy(sql`2 desc`)
      .limit(20),
  ]);

  const byDay = days_.map((r) => ({
    day: r.day,
    accepted: Number(r.accepted),
    rejected: Number(r.rejected),
  }));
  const byRegion = regions.map((r) => ({
    region: r.region,
    accepted: Number(r.accepted),
    rejected: Number(r.rejected),
  }));
  const total = byDay.reduce((n, d) => n + d.accepted + d.rejected, 0);
  return {
    total,
    accepted: byDay.reduce((n, d) => n + d.accepted, 0),
    rejected: byDay.reduce((n, d) => n + d.rejected, 0),
    byDay,
    byRegion,
  };
}

export interface CapiLogRow {
  id: string;
  internalEvent: string;
  providerEvent: string;
  status: string;
  httpStatus: number | null;
  errorMessage: string | null;
  testEventCode: string | null;
  createdAt: Date;
}

/** The most recent Conversions API sends, redacted at write time. */
export async function getCapiLog(limit = 25, db?: LogDb | null): Promise<CapiLogRow[]> {
  const database = db === undefined ? getDb() : db;
  if (!database) return [];
  return database
    .select({
      id: capiLog.id,
      internalEvent: capiLog.internalEvent,
      providerEvent: capiLog.providerEvent,
      status: capiLog.status,
      httpStatus: capiLog.httpStatus,
      errorMessage: capiLog.errorMessage,
      testEventCode: capiLog.testEventCode,
      createdAt: capiLog.createdAt,
    })
    .from(capiLog)
    .orderBy(desc(capiLog.createdAt))
    .limit(limit);
}
