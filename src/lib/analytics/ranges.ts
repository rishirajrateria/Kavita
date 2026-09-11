/**
 * Date-range presets for the dashboard and the previous-period maths behind every
 * comparison tile. All days are UTC `YYYY-MM-DD` strings, matching `analytics_daily_rollup.day`.
 * Pure: `now` is injectable so tests and server components agree.
 */
export const RANGE_PRESETS = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "90d",
  "this_month",
  "last_month",
  "custom",
] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const RANGE_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  this_month: "This month",
  last_month: "Last month",
  custom: "Custom",
};

export interface DateRange {
  /** Inclusive `YYYY-MM-DD`. */
  from: string;
  /** Inclusive `YYYY-MM-DD`. */
  to: string;
}

export interface ResolvedRange extends DateRange {
  preset: RangePreset;
  label: string;
  /** Number of days in the range (inclusive). */
  days: number;
  /** The immediately preceding period of the same length (or the previous calendar month). */
  previous: DateRange;
}

const DAY_MS = 86_400_000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDay(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_DAY.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  );
}

export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function addDays(day: string, delta: number): string {
  return toDay(new Date(parseDay(day).getTime() + delta * DAY_MS));
}

/** Inclusive day count between two `YYYY-MM-DD` values. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS) + 1;
}

/** Every day in the range, ascending. */
export function eachDay(range: DateRange): string[] {
  const out: string[] = [];
  const end = parseDay(range.to).getTime();
  for (let t = parseDay(range.from).getTime(); t <= end; t += DAY_MS) out.push(toDay(new Date(t)));
  return out;
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** The period of equal length ending the day before `range.from`. */
export function previousPeriod(range: DateRange): DateRange {
  const length = daysBetween(range.from, range.to);
  const to = addDays(range.from, -1);
  return { from: addDays(to, -(length - 1)), to };
}

export interface ResolveInput {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}

/**
 * Turn search params into a concrete range. Unknown presets and malformed custom dates fall
 * back to the last 30 days; a custom range is clamped to 366 days and ordered.
 */
export function resolveRange(input: ResolveInput, now: Date = new Date()): ResolvedRange {
  const today = toDay(now);
  const preset: RangePreset = (RANGE_PRESETS as readonly string[]).includes(input.preset ?? "")
    ? (input.preset as RangePreset)
    : input.from && input.to
      ? "custom"
      : "30d";

  let from: string;
  let to: string;
  switch (preset) {
    case "today":
      from = to = today;
      break;
    case "yesterday":
      from = to = addDays(today, -1);
      break;
    case "7d":
      to = today;
      from = addDays(today, -6);
      break;
    case "90d":
      to = today;
      from = addDays(today, -89);
      break;
    case "this_month":
      from = toDay(monthStart(now));
      to = today;
      break;
    case "last_month": {
      const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      from = toDay(monthStart(lastMonth));
      to = toDay(monthEnd(lastMonth));
      break;
    }
    case "custom": {
      if (isIsoDay(input.from) && isIsoDay(input.to)) {
        [from, to] = input.from <= input.to ? [input.from, input.to] : [input.to, input.from];
        if (to > today) to = today;
        if (daysBetween(from, to) > 366) from = addDays(to, -365);
        break;
      }
      to = today;
      from = addDays(today, -29);
      break;
    }
    case "30d":
    default:
      to = today;
      from = addDays(today, -29);
  }

  let previous: DateRange;
  if (preset === "this_month" || preset === "last_month") {
    const anchor = parseDay(from);
    const prev = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1));
    const prevEnd =
      preset === "this_month"
        ? Math.min(monthEnd(prev).getUTCDate(), parseDay(to).getUTCDate())
        : monthEnd(prev).getUTCDate();
    previous = {
      from: toDay(prev),
      to: toDay(new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prevEnd))),
    };
  } else {
    previous = previousPeriod({ from, to });
  }

  return { preset, label: RANGE_LABELS[preset], from, to, days: daysBetween(from, to), previous };
}

/** Percentage change from `previous` to `current`; `null` when there is nothing to compare. */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
