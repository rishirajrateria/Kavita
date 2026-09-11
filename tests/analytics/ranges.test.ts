/** Date-range presets and previous-period maths (`src/lib/analytics/ranges.ts`). */
import { equal } from "../seo-plumbing/_assert";
import {
  daysBetween,
  eachDay,
  percentChange,
  previousPeriod,
  resolveRange,
} from "@/lib/analytics/ranges";

export function run() {
  const now = new Date("2026-09-11T10:30:00Z");
  const r30 = resolveRange({ preset: "30d" }, now);
  equal(r30.from, "2026-08-13", "30d from");
  equal(r30.to, "2026-09-11", "30d to");
  equal(r30.days, 30, "30d length");
  equal(r30.previous.from, "2026-07-14", "30d previous from");
  equal(r30.previous.to, "2026-08-12", "30d previous to");

  const today = resolveRange({ preset: "today" }, now);
  equal(today.from, "2026-09-11", "today");
  equal(today.previous.from, "2026-09-10", "today's previous is yesterday");

  const thisMonth = resolveRange({ preset: "this_month" }, now);
  equal(thisMonth.from, "2026-09-01", "this month from");
  equal(thisMonth.previous.from, "2026-08-01", "this month compares to last month");
  equal(thisMonth.previous.to, "2026-08-11", "…to the same day of last month");

  const lastMonth = resolveRange({ preset: "last_month" }, now);
  equal(`${lastMonth.from}..${lastMonth.to}`, "2026-08-01..2026-08-31", "last month");
  equal(
    `${lastMonth.previous.from}..${lastMonth.previous.to}`,
    "2026-07-01..2026-07-31",
    "last month's previous",
  );

  const custom = resolveRange({ from: "2026-09-05", to: "2026-09-01" }, now);
  equal(custom.preset, "custom", "custom detected from dates");
  equal(`${custom.from}..${custom.to}`, "2026-09-01..2026-09-05", "custom dates are ordered");
  equal(
    resolveRange({ preset: "custom", from: "bad", to: "2026-09-01" }, now).preset,
    "custom",
    "invalid custom keeps preset",
  );
  equal(
    resolveRange({ preset: "custom", from: "bad", to: "2026-09-01" }, now).from,
    "2026-08-13",
    "…but falls back to 30 days",
  );
  equal(resolveRange({ preset: "nope" }, now).preset, "30d", "unknown preset falls back to 30d");
  equal(
    resolveRange({ from: "2026-09-10", to: "2027-01-01" }, now).to,
    "2026-09-11",
    "custom is clamped to today",
  );

  equal(daysBetween("2026-01-01", "2026-01-31"), 31, "daysBetween is inclusive");
  equal(
    eachDay({ from: "2026-02-27", to: "2026-03-02" }).join(","),
    "2026-02-27,2026-02-28,2026-03-01,2026-03-02",
    "eachDay crosses months",
  );
  equal(
    previousPeriod({ from: "2026-03-01", to: "2026-03-07" }).from,
    "2026-02-22",
    "previous period same length",
  );
  equal(percentChange(120, 100), 20, "percent change");
  equal(percentChange(5, 0), null, "no previous → null");
  equal(percentChange(0, 0), 0, "zero to zero → 0");
}
