/**
 * Row Level Security helpers.
 *
 * Policy model (CLAUDE.md §10, Phase 1):
 *  - `anon` (and any non-admin `authenticated` user) may SELECT only public rows of public
 *    tables, and INSERT only into `consent_log` and unpublished `testimonials`.
 *  - `authenticated` users listed in `admin_users` (checked via the security-definer function
 *    `public.is_admin()`, created in the first custom migration) get full access everywhere.
 *  - `service_role` bypasses RLS at the Postgres level (Supabase grants it BYPASSRLS), so route
 *    handlers and the seed script never need a policy.
 *
 * Attaching at least one `pgPolicy` to a table makes drizzle-kit emit `ENABLE ROW LEVEL
 * SECURITY` for it. Every table in the schema attaches at least `adminAll()`, so no table is
 * ever left open or without a policy.
 */
import { sql, type SQL } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

/** `true` only for signed-in users with an active `admin_users` row. Security definer, so it can
 *  read `admin_users` without recursing into that table's own RLS policy. */
export const isAdmin = sql`(select public.is_admin())`;

const publicRoles = [anonRole, authenticatedRole];

/** Admins may do anything on this table. Every table carries this policy. */
export function adminAll(table: string) {
  return pgPolicy(`${table}_admin_all`, {
    for: "all",
    to: authenticatedRole,
    using: isAdmin,
    withCheck: isAdmin,
  });
}

/** Anyone (anon or signed in) may read rows matching `using`; defaults to every row. */
export function publicSelect(table: string, using: SQL = sql`true`) {
  return pgPolicy(`${table}_public_select`, { for: "select", to: publicRoles, using });
}

/** Anyone may insert rows that satisfy `withCheck`. Used for consent logging and testimonial
 *  submission only. */
export function publicInsert(table: string, withCheck: SQL) {
  return pgPolicy(`${table}_public_insert`, { for: "insert", to: publicRoles, withCheck });
}
