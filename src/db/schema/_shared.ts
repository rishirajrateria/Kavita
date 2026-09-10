/**
 * Column helpers and cross-domain enums shared by every schema file.
 *
 * Every table gets `id uuid default gen_random_uuid()`, `created_at` and `updated_at`
 * (timestamptz). `updated_at` is maintained by the `public.set_updated_at()` trigger that the
 * custom migrations install on every table — application code never writes it.
 */
import { sql } from "drizzle-orm";
import { customType, pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () =>
  uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`);

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

/** Currencies the practice accepts (CLAUDE.md §11). */
export const CURRENCIES = ["INR", "USD", "GBP", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const currencyEnum = pgEnum("currency", CURRENCIES);

/** Postgres `bytea`, used for encrypted-at-rest personal data. Never store plaintext here. */
export const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType() {
    return "bytea";
  },
});
