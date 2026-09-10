import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Migrations are generated into `supabase/migrations/` with Supabase-style timestamp prefixes so
 * both `pnpm db:migrate` (drizzle-kit) and `supabase db push` can apply them.
 * `drizzle-kit generate` needs no database; `migrate` and `studio` need `SUPABASE_DB_URL`.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
  /** Supabase already provides `anon`, `authenticated` and `service_role`; never create them. */
  entities: { roles: { provider: "supabase" } },
  strict: true,
  verbose: true,
});
