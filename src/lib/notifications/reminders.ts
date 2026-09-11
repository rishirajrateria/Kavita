/**
 * Reminder window maths — pure and unit-tested with a fixed `now`. The cron fires every 15
 * minutes; each window is 30 minutes wide so a firing that drifts by a few minutes still catches
 * every booking exactly once (the notification log deduplicates the overlap).
 */
import type { BookingStatus } from "@/db/schema";

const MINUTE = 60_000;

export interface ReminderWindow {
  kind: "reminder_24h" | "reminder_1h";
  /** Inclusive lower bound of `starts_at`. */
  from: Date;
  /** Exclusive upper bound of `starts_at`. */
  to: Date;
}

/** `[now + 23h45, now + 24h15)` and `[now + 45m, now + 75m)`. */
export function reminderWindows(now: Date): ReminderWindow[] {
  const t = now.getTime();
  return [
    {
      kind: "reminder_24h",
      from: new Date(t + (24 * 60 - 15) * MINUTE),
      to: new Date(t + (24 * 60 + 15) * MINUTE),
    },
    { kind: "reminder_1h", from: new Date(t + 45 * MINUTE), to: new Date(t + 75 * MINUTE) },
  ];
}

/** Which reminder a booking starting at `startsAt` is due for at `now`, or `null`. */
export function reminderKindFor(startsAt: Date, now: Date): ReminderWindow["kind"] | null {
  const s = startsAt.getTime();
  for (const w of reminderWindows(now)) {
    if (s >= w.from.getTime() && s < w.to.getTime()) return w.kind;
  }
  return null;
}

/** Earliest and latest `starts_at` any reminder window covers, for one database query. */
export function reminderQueryRange(now: Date): { from: Date; to: Date } {
  const windows = reminderWindows(now);
  return {
    from: new Date(Math.min(...windows.map((w) => w.from.getTime()))),
    to: new Date(Math.max(...windows.map((w) => w.to.getTime()))),
  };
}

/**
 * Bookings that hold a real appointment and should be reminded. `awaiting_payment` is excluded:
 * the slot is not the client's until payment completes. `pending` is included because v1 has no
 * gateway and a `pending` booking is a held appointment awaiting the practitioner's confirmation.
 */
export const REMINDABLE_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "payment_pending_offline",
] as const satisfies readonly BookingStatus[];

export type RemindableStatus = (typeof REMINDABLE_STATUSES)[number];

export function isRemindable(status: BookingStatus): status is RemindableStatus {
  return (REMINDABLE_STATUSES as readonly BookingStatus[]).includes(status);
}
