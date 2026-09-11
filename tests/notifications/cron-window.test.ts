import { check, equal } from "../seo-plumbing/_assert";
import {
  isRemindable,
  reminderKindFor,
  reminderQueryRange,
  reminderWindows,
} from "@/lib/notifications/reminders";

const MIN = 60_000;
const at = (now: Date, minutes: number) => new Date(now.getTime() + minutes * MIN);

export function run() {
  const now = new Date("2026-10-20T12:00:00Z");
  const windows = reminderWindows(now);
  equal(windows.length, 2, "cron: two windows");
  equal(
    windows[0]?.from.toISOString(),
    "2026-10-21T11:45:00.000Z",
    "cron: 24h window opens at +23h45",
  );
  equal(
    windows[0]?.to.toISOString(),
    "2026-10-21T12:15:00.000Z",
    "cron: 24h window closes at +24h15",
  );
  equal(
    windows[1]?.from.toISOString(),
    "2026-10-20T12:45:00.000Z",
    "cron: 1h window opens at +45m",
  );
  equal(windows[1]?.to.toISOString(), "2026-10-20T13:15:00.000Z", "cron: 1h window closes at +75m");

  // 24h window: inclusive lower, exclusive upper.
  equal(reminderKindFor(at(now, 24 * 60 - 15), now), "reminder_24h", "cron: +23h45 → 24h");
  equal(reminderKindFor(at(now, 24 * 60), now), "reminder_24h", "cron: +24h → 24h");
  equal(reminderKindFor(at(now, 24 * 60 + 14), now), "reminder_24h", "cron: +24h14 → 24h");
  equal(reminderKindFor(at(now, 24 * 60 + 15), now), null, "cron: +24h15 is outside");
  equal(reminderKindFor(at(now, 24 * 60 - 16), now), null, "cron: +23h44 is outside");

  // 1h window.
  equal(reminderKindFor(at(now, 45), now), "reminder_1h", "cron: +45m → 1h");
  equal(reminderKindFor(at(now, 60), now), "reminder_1h", "cron: +60m → 1h");
  equal(reminderKindFor(at(now, 74), now), "reminder_1h", "cron: +74m → 1h");
  equal(reminderKindFor(at(now, 75), now), null, "cron: +75m is outside");
  equal(reminderKindFor(at(now, 44), now), null, "cron: +44m is outside");

  // Nothing in between, nothing in the past.
  equal(reminderKindFor(at(now, 6 * 60), now), null, "cron: +6h → nothing");
  equal(reminderKindFor(at(now, -60), now), null, "cron: past → nothing");

  // Consecutive 15-minute firings each see the booking at most twice, deduped by the log.
  const start = at(now, 24 * 60 + 5);
  const hits = [0, 15, 30, 45].filter((m) => reminderKindFor(start, at(now, m)) !== null);
  check(
    hits.length >= 1 && hits.length <= 2,
    `cron: booking seen by 1–2 firings, got ${hits.length}`,
  );

  const range = reminderQueryRange(now);
  equal(range.from.toISOString(), "2026-10-20T12:45:00.000Z", "cron: query range from");
  equal(range.to.toISOString(), "2026-10-21T12:15:00.000Z", "cron: query range to");

  check(isRemindable("confirmed") && isRemindable("payment_pending_offline"), "cron: remindable");
  check(!isRemindable("cancelled") && !isRemindable("awaiting_payment"), "cron: not remindable");
}
