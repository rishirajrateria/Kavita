import { check, equal } from "../seo-plumbing/_assert";
import {
  isRemindable,
  reminderKindFor,
  reminderQueryRange,
  reminderWindows,
} from "@/lib/notifications/reminders";

const MIN = 60_000;
const at = (now: Date, minutes: number) => new Date(now.getTime() + minutes * MIN);

/** Vercel Pro: the cron fires every 15 minutes. */
const FREQUENT = 15;
/** Vercel Hobby: one run per day is all the plan allows. */
const DAILY = 1440;

export function run() {
  const now = new Date("2026-10-20T12:00:00Z");

  // ---- frequent cadence (Pro, */15) ------------------------------------------------------
  const frequent = reminderWindows(now, FREQUENT);
  equal(frequent.length, 2, "cron/15m: both windows");
  equal(frequent[0]?.kind, "reminder_1h", "cron/15m: 1-hour window first");
  equal(frequent[0]?.from.toISOString(), "2026-10-20T12:00:00.000Z", "cron/15m: 1h opens at now");
  equal(frequent[0]?.to.toISOString(), "2026-10-20T13:00:00.000Z", "cron/15m: 1h closes at +60m");
  equal(frequent[1]?.from.toISOString(), "2026-10-20T13:00:00.000Z", "cron/15m: 24h opens at +1h");
  equal(
    frequent[1]?.to.toISOString(),
    "2026-10-21T12:15:00.000Z",
    "cron/15m: 24h closes at +24h15",
  );

  equal(reminderKindFor(at(now, 24 * 60), now, FREQUENT), "reminder_24h", "cron/15m: +24h → 24h");
  equal(reminderKindFor(at(now, 6 * 60), now, FREQUENT), "reminder_24h", "cron/15m: +6h → 24h");
  equal(reminderKindFor(at(now, 30), now, FREQUENT), "reminder_1h", "cron/15m: +30m → 1h");
  equal(reminderKindFor(at(now, 59), now, FREQUENT), "reminder_1h", "cron/15m: +59m → 1h");
  equal(reminderKindFor(at(now, 60), now, FREQUENT), "reminder_24h", "cron/15m: +60m → 24h");
  equal(reminderKindFor(at(now, 24 * 60 + 15), now, FREQUENT), null, "cron/15m: +24h15 outside");
  equal(reminderKindFor(at(now, -60), now, FREQUENT), null, "cron/15m: past → nothing");

  // ---- daily cadence (Hobby) -------------------------------------------------------------
  const daily = reminderWindows(now, DAILY);
  equal(daily.length, 1, "cron/daily: only the day-ahead window");
  equal(daily[0]?.kind, "reminder_24h", "cron/daily: no 1-hour reminder is deliverable");
  equal(daily[0]?.from.toISOString(), "2026-10-20T13:00:00.000Z", "cron/daily: opens at +1h");
  equal(daily[0]?.to.toISOString(), "2026-10-22T12:00:00.000Z", "cron/daily: closes at +48h");

  equal(reminderKindFor(at(now, 30), now, DAILY), null, "cron/daily: +30m → nothing (too late)");
  equal(reminderKindFor(at(now, 26 * 60), now, DAILY), "reminder_24h", "cron/daily: +26h → 24h");
  equal(reminderKindFor(at(now, 47 * 60), now, DAILY), "reminder_24h", "cron/daily: +47h → 24h");
  equal(reminderKindFor(at(now, 49 * 60), now, DAILY), null, "cron/daily: +49h waits for tomorrow");

  // The regression this cadence-awareness exists to prevent: with the old fixed 30-minute
  // window, a daily run reached almost nothing. Every booking must be caught by some run.
  for (const hoursOut of [2, 5, 13, 23, 25, 30, 40, 47]) {
    const start = at(now, hoursOut * 60);
    const caught = [0, 1, 2].some(
      (day) => reminderKindFor(start, at(now, day * DAILY), DAILY) !== null,
    );
    check(caught, `cron/daily: a booking ${hoursOut}h out is reminded by some run`);
  }

  // Consecutive firings may see a booking more than once; the notification log dedupes.
  const start = at(now, 24 * 60 + 5);
  const hits = [0, 15, 30, 45].filter((m) => reminderKindFor(start, at(now, m), FREQUENT) !== null);
  check(hits.length >= 1, `cron/15m: booking seen by at least one firing, got ${hits.length}`);

  // ---- query range spans every window ----------------------------------------------------
  const range = reminderQueryRange(now, FREQUENT);
  equal(range.from.toISOString(), "2026-10-20T12:00:00.000Z", "cron/15m: query range from");
  equal(range.to.toISOString(), "2026-10-21T12:15:00.000Z", "cron/15m: query range to");
  const dailyRange = reminderQueryRange(now, DAILY);
  equal(dailyRange.from.toISOString(), "2026-10-20T13:00:00.000Z", "cron/daily: query range from");
  equal(dailyRange.to.toISOString(), "2026-10-22T12:00:00.000Z", "cron/daily: query range to");

  check(isRemindable("confirmed") && isRemindable("payment_pending_offline"), "cron: remindable");
  check(!isRemindable("cancelled") && !isRemindable("awaiting_payment"), "cron: not remindable");
}
