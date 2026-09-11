/**
 * The database shape the booking engine accepts: any Drizzle Postgres database over the project
 * schema — postgres.js in the app, PGlite in the integration tests.
 */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";

export type BookingDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Postgres `unique_violation` on the active-slot index, however deeply the driver wraps it. */
export function isSlotTakenError(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 4) return false;
  const e = error as {
    code?: unknown;
    constraint?: unknown;
    constraint_name?: unknown;
    message?: unknown;
    cause?: unknown;
  };
  const text = `${String(e.constraint ?? "")} ${String(e.constraint_name ?? "")} ${String(e.message ?? "")}`;
  if (e.code === "23505" && text.includes("bookings_active_slot_uidx")) return true;
  if (e.code === "23505" && !text.includes("uidx") && !text.includes("_key")) return true;
  return isSlotTakenError(e.cause, depth + 1);
}
