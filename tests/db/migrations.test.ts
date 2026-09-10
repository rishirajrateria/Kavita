/**
 * Applies every SQL migration in supabase/migrations, in order, to an in-process PGlite
 * (Postgres-in-WASM) database and then asserts RLS is enabled on every public table.
 * Supabase-specific pieces (roles, auth.uid()) are stubbed first. Run: pnpm test:migrations
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const db = new PGlite({ extensions: { pgcrypto } });

async function main() {
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `);
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    const statements = sql.split("--> statement-breakpoint");
    for (const s of statements) {
      if (!s.trim()) continue;
      try {
        await db.exec(s);
      } catch (e) {
        console.error(`FAILED in ${f}:\n${s.slice(0, 400)}\n`);
        throw e;
      }
    }
    console.log(`applied ${f} (${statements.length} statements)`);
  }
  const tables = await db.query<{ tablename: string; rowsecurity: boolean }>(
    `select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1`,
  );
  const noRls = tables.rows.filter((t) => !t.rowsecurity).map((t) => t.tablename);
  const policies = await db.query<{ n: number }>(`select count(*)::int as n from pg_policies`);
  const noPolicy = (
    await db.query<{ tablename: string }>(
      `select t.tablename from pg_tables t where t.schemaname='public'
       and not exists (select 1 from pg_policies p where p.tablename = t.tablename) order by 1`,
    )
  ).rows.map((r) => r.tablename);
  const triggers = await db.query<{ n: number }>(
    `select count(*)::int as n from pg_trigger where tgname like '%updated_at%' and not tgisinternal`,
  );
  console.log(
    `tables=${tables.rows.length} policies=${policies.rows[0]?.n} updated_at_triggers=${triggers.rows[0]?.n}`,
  );
  if (noRls.length) throw new Error(`RLS not enabled on: ${noRls.join(", ")}`);
  if (noPolicy.length) throw new Error(`No policy on: ${noPolicy.join(", ")}`);
  if (tables.rows.length < 27) throw new Error(`expected >= 27 tables, got ${tables.rows.length}`);
  console.log("migrations OK");
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
