/**
 * Pure calendar-grid maths for the admin week and month views, in the practitioner's timezone.
 * Server-rendered grids read these; nothing here touches the database.
 */

export interface CalendarDay {
  /** `YYYY-MM-DD` in the practitioner's zone. */
  date: string;
  /** Instant at 00:00 local. */
  start: Date;
  /** Instant at 00:00 local of the next day (exclusive). */
  end: Date;
  weekday: number;
  inMonth: boolean;
  isToday: boolean;
}

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` of an instant in `tz`. */
export function localDate(at: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** `HH:MM` of an instant in `tz`. */
export function localTime(at: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}

/** The instant at local midnight of `date` (`YYYY-MM-DD`) in `tz`; DST-safe via Intl. */
export function localMidnight(date: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  let guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(guess);
    const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value);
    const seen = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    const target = Date.UTC(y, m - 1, d, 0, 0);
    if (seen === target) break;
    guess = new Date(guess.getTime() + (target - seen));
  }
  return guess;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: string): string {
  const wd = weekdayOf(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

function day(date: string, tz: string, month: string, today: string): CalendarDay {
  const start = localMidnight(date, tz);
  return {
    date,
    start,
    end: localMidnight(addDays(date, 1), tz),
    weekday: weekdayOf(date),
    inMonth: date.startsWith(month),
    isToday: date === today,
  };
}

/** Seven days from the Monday of the week containing `date`. */
export function weekGrid(date: string, tz: string, now = new Date()): CalendarDay[] {
  const monday = startOfWeek(date);
  const today = localDate(now, tz);
  return Array.from({ length: 7 }, (_, i) => day(addDays(monday, i), tz, date.slice(0, 7), today));
}

/** Full weeks (Mon–Sun) covering the month of `date` (`YYYY-MM` or `YYYY-MM-DD`). */
export function monthGrid(date: string, tz: string, now = new Date()): CalendarDay[][] {
  const month = date.slice(0, 7);
  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const today = localDate(now, tz);
  const weeks: CalendarDay[][] = [];
  let cursor = startOfWeek(first);
  while (cursor <= last || weeks.length === 0) {
    weeks.push(Array.from({ length: 7 }, (_, i) => day(addDays(cursor, i), tz, month, today)));
    cursor = addDays(cursor, 7);
    if (weeks.length > 6) break;
  }
  return weeks;
}

/** Overall instant range of a grid, for one database query. */
export function gridRange(days: readonly CalendarDay[]): { from: Date; to: Date } {
  const from = days[0]?.start ?? new Date(0);
  const to = new Date((days[days.length - 1]?.end.getTime() ?? from.getTime()) - 1);
  return { from, to };
}

export const monthLabel = (date: string) =>
  new Date(`${date.slice(0, 7)}-01T12:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const shiftMonth = (date: string, n: number) => {
  const [y, m] = date.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

export { DAY_MS };
