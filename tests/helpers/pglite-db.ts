/**
 * Postgres-in-WASM for integration tests: applies every `supabase/migrations/*.sql` in order
 * (Supabase roles and `auth.uid()` stubbed, as in tests/db/migrations.test.ts) and returns a
 * Drizzle database over the project schema. `seedTestContent()` inserts the seed site settings,
 * services and availability rules with their stable ids.
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as schema from "@/db/schema";
import {
  SEED_NS,
  SITE_SETTINGS_KEY,
  availabilityRuleSeedKey,
  availabilityRulesSeed,
  servicesSeed,
  siteSettingsSeed,
  stableId,
} from "@/content/seed";

export type TestDb = PgliteDatabase<typeof schema>;

export interface TestDatabase {
  db: TestDb;
  pglite: PGlite;
  close(): Promise<void>;
}

export async function applyMigrations(pglite: PGlite): Promise<string[]> {
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await pglite.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
    end $$;
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `);
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await pglite.exec(statement);
    }
  }
  return files;
}

export async function createTestDb(): Promise<TestDatabase> {
  const pglite = new PGlite({ extensions: { pgcrypto } });
  await applyMigrations(pglite);
  const db = drizzle(pglite, { schema });
  return { db, pglite, close: () => pglite.close() };
}

/** Seed site settings, services and availability rules; returns the ids used. */
export async function seedTestContent(db: TestDb) {
  const settingsId = stableId(SEED_NS.siteSettings, SITE_SETTINGS_KEY);
  await db.insert(schema.siteSettings).values({ id: settingsId, ...siteSettingsSeed });
  const serviceRows = servicesSeed.map((s) => ({ id: stableId(SEED_NS.services, s.slug), ...s }));
  await db.insert(schema.services).values(serviceRows);
  const ruleRows = availabilityRulesSeed.map((r) => ({
    id: stableId(SEED_NS.availabilityRules, availabilityRuleSeedKey(r)),
    ...r,
  }));
  await db.insert(schema.availabilityRules).values(ruleRows);
  return {
    settingsId,
    serviceIds: serviceRows.map((r) => r.id),
    ruleIds: ruleRows.map((r) => r.id),
  };
}
