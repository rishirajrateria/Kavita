/**
 * The database shape the analytics layer accepts: any Drizzle Postgres database over the
 * project schema — postgres.js in the app, PGlite in tests and the seed. Every function in
 * `src/lib/analytics` takes an optional `db` and falls back to `getDb()`.
 */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";

export type AnalyticsDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** `db` when given (tests), else the app pool, else `null` when unconfigured. */
export function resolveDb(db?: AnalyticsDb | null): AnalyticsDb | null {
  if (db !== undefined) return db;
  return getDb();
}

/** True when `SUPABASE_DB_URL` is set — the dashboard shows a "connect Supabase" state otherwise. */
export function isAnalyticsConfigured(): boolean {
  return getDb() !== null;
}

/** Raw sessions, pageviews and events older than this are deleted by the rollup cron. */
export const RAW_RETENTION_DAYS = 90;
