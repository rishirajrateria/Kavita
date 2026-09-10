/**
 * Lazily-created Drizzle client over `postgres` (postgres.js). Never opened at import time, so
 * builds and SSG work with no database. Call `getDb()`; it returns `null` when unconfigured.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | undefined;
let db: Db | undefined;

export function isDatabaseConfigured(): boolean {
  return getEnv().SUPABASE_DB_URL !== undefined;
}

export function getDb(): Db | null {
  const url = getEnv().SUPABASE_DB_URL;
  if (!url) return null;
  if (!db) {
    // `prepare: false` is required by Supabase's transaction-mode pooler (PgBouncer).
    client ??= postgres(url, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 });
    db = drizzle(client, { schema });
  }
  return db;
}

/** Close the pool — used by scripts (seed, tests); the app never calls it. */
export async function closeDb(): Promise<void> {
  await client?.end({ timeout: 5 });
  client = undefined;
  db = undefined;
}

export { schema };
