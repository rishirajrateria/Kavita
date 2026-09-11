/**
 * Reminder window maths — pure and unit-tested with a fixed `now`.
 *
 * The windows are derived from how often the cron actually fires, because that cadence is a
 * hosting-plan decision: Vercel's Hobby plan permits one run per day, Pro permits any schedule.
 * A fixed narrow window (the original `[now+23h45, now+24h15)`) only works on a frequent cron —
 * on a daily run almost every booking falls outside it and is never reminded at all. So each
 * window spans the whole stretch the next run will not cover, and `notification_log` dedupes,
 * which makes exactly one reminder go out per booking per kind at any cadence.
 *
 * Set `CRON_REMINDER_INTERVAL_MINUTES` to match `vercel.json`:
 *   1440 (default, Hobby / daily) → one reminder per booking, 1–48 h ahead; no 1-hour reminder,
 *                                   which a once-a-day cron physically cannot deliver.
 *     15 (Pro)                    → the intended behaviour: a reminder ~24 h ahead and again
 *                                   in the last hour.
 */
import type { BookingStatus } from "@/db/schema";

const MINUTE = 60_000;

/** Daily: the only cadence Vercel's Hobby plan allows. */
export const DEFAULT_REMINDER_INTERVAL_MINUTES = 1440;

/** A 1-hour reminder is only deliverable when the cron runs at least hourly. */
export const HOURLY_REMINDER_MAX_INTERVAL_MINUTES = 60;

/** How often `/api/cron/reminders` fires, per `CRON_REMINDER_INTERVAL_MINUTES`. */
export function reminderIntervalMinutes(): number {
  const raw = Number(process.env.CRON_REMINDER_INTERVAL_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_REMINDER_INTERVAL_MINUTES;
}

export interface ReminderWindow {
  kind: "reminder_24h" | "reminder_1h";
  /** Inclusive lower bound of `starts_at`. */
  from: Date;
  /** Exclusive upper bound of `starts_at`. */
  to: Date;
}

/**
 * The windows a run at `now` covers. They never overlap, so a booking maps to exactly one kind.
 *
 * - `reminder_1h`: `[now, now + 1h)`, and only when the cron runs at least hourly.
 * - `reminder_24h`: `[now + 1h, now + 24h + interval)`. The hour of lead-in keeps a booking made
 *   minutes before its slot from being told it is "tomorrow"; the interval added on top is what
 *   guarantees a daily run still reaches every booking before it happens.
 */
export function reminderWindows(
  now: Date,
  intervalMinutes: number = reminderIntervalMinutes(),
): ReminderWindow[] {
  const t = now.getTime();
  const hourlyEnabled = intervalMinutes <= HOURLY_REMINDER_MAX_INTERVAL_MINUTES;
  /** Lead-in before the "day ahead" window opens; also where the 1-hour window ends. */
  const dayLeadMinutes = 60;
  const windows: ReminderWindow[] = [];
  if (hourlyEnabled) {
    windows.push({
      kind: "reminder_1h",
      from: new Date(t),
      to: new Date(t + dayLeadMinutes * MINUTE),
    });
  }
  windows.push({
    kind: "reminder_24h",
    from: new Date(t + dayLeadMinutes * MINUTE),
    to: new Date(t + (24 * 60 + intervalMinutes) * MINUTE),
  });
  return windows;
}

/** Which reminder a booking starting at `startsAt` is due for at `now`, or `null`. */
export function reminderKindFor(
  startsAt: Date,
  now: Date,
  intervalMinutes: number = reminderIntervalMinutes(),
): ReminderWindow["kind"] | null {
  const s = startsAt.getTime();
  for (const w of reminderWindows(now, intervalMinutes)) {
    if (s >= w.from.getTime() && s < w.to.getTime()) return w.kind;
  }
  return null;
}

/** Earliest and latest `starts_at` any reminder window covers, for one database query. */
export function reminderQueryRange(
  now: Date,
  intervalMinutes: number = reminderIntervalMinutes(),
): { from: Date; to: Date } {
  const windows = reminderWindows(now, intervalMinutes);
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
