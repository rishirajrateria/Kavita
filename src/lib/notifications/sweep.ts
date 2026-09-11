/**
 * The reminder sweep behind `GET /api/cron/reminders`: load every remindable booking whose
 * `starts_at` falls in either window, decide the kind, hand it to `notify()` (which dedupes).
 * Pure selection lives in `reminders.ts`; this file only touches the database.
 */
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, clients, services } from "@/db/schema";
import { getSiteSettings } from "@/lib/data/site";
import { notify as defaultNotify } from "./index";
import { REMINDABLE_STATUSES, reminderKindFor, reminderQueryRange } from "./reminders";
import type { BookingWithRelations, NotificationKind, NotifyOutcome } from "./types";

export interface SweepResult {
  ok: true;
  /** Bookings found inside a window. */
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
  /** False when no database is configured: nothing to sweep. */
  database: boolean;
  now: string;
}

export async function runReminderSweep(
  now: Date = new Date(),
  notify: (
    kind: NotificationKind,
    data: BookingWithRelations,
  ) => Promise<NotifyOutcome> = defaultNotify,
): Promise<SweepResult> {
  const base: SweepResult = {
    ok: true,
    checked: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    database: false,
    now: now.toISOString(),
  };
  const db = getDb();
  if (!db) return base;
  base.database = true;

  const range = reminderQueryRange(now);
  const rows = await db
    .select({ booking: bookings, client: clients, service: services })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        inArray(bookings.status, [...REMINDABLE_STATUSES]),
        gte(bookings.startsAt, range.from),
        lt(bookings.startsAt, range.to),
      ),
    );
  const settings = await getSiteSettings();

  for (const row of rows) {
    const kind = reminderKindFor(row.booking.startsAt, now);
    if (!kind) continue;
    base.checked += 1;
    const outcome = await notify(kind, { ...row, settings });
    base.sent += outcome.sent;
    base.skipped += outcome.skipped;
    base.failed += outcome.failed;
  }
  return base;
}
