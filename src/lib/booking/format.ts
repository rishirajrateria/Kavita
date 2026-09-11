/**
 * Display helpers for the booking flow (P4-B). Safe in the browser and on the server: pure
 * functions over `Intl` only — no date library, no timezone table. Every instant arrives as an
 * ISO-8601 UTC string (the API contract) and is rendered in an explicit IANA zone; nothing here
 * ever calls a local-time `Date` method.
 */
import { formatOffsetLabel, tzAbbreviation, tzOffsetMinutes } from "@/lib/data/consultation-window";

export type ZoneStyle = "time" | "date" | "long-date" | "weekday-date" | "datetime" | "month-year";

const toDate = (at: string | Date): Date => (at instanceof Date ? at : new Date(at));

/** Two-digit helper. */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * `Wednesday 18 March 2026` / `Wed 18 Mar` — assembled from parts so the output is identical
 * on every ICU build (some insert a comma after the weekday, some do not).
 */
function joinParts(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return [get("weekday"), get("day"), get("month"), get("year")].filter(Boolean).join(" ");
}

/**
 * Format an instant in a zone. Times use 12-hour clock with upper-case AM/PM (`3:00 PM`); dates
 * use day-month order in international English (`Wednesday 18 March 2026`).
 */
export function formatInZone(
  at: string | Date,
  timeZone: string,
  style: ZoneStyle = "time",
): string {
  const date = toDate(at);
  switch (style) {
    case "time":
      return new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    case "date":
      return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    case "long-date":
      return joinParts(date, timeZone, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "weekday-date":
      return joinParts(date, timeZone, { weekday: "short", day: "numeric", month: "short" });
    case "datetime":
      return `${formatInZone(date, timeZone, "weekday-date")}, ${formatInZone(date, timeZone, "time")}`;
    case "month-year":
      return new Intl.DateTimeFormat("en-GB", { timeZone, month: "long", year: "numeric" }).format(
        date,
      );
  }
}

/** Short zone label for an instant: `IST`, `EDT`, `BST`, `GST`, or `GMT+8` when no name exists. */
export function zoneAbbreviation(timeZone: string, at: string | Date): string {
  return tzAbbreviation(timeZone, toDate(at));
}

export interface DualZoneParts {
  /** e.g. `3:00 PM` */
  clientTime: string;
  clientZone: string;
  /** Null when the two zones show the same wall-clock time. */
  practitionerTime: string | null;
  practitionerZone: string;
  /** True when the practitioner's calendar date differs from the client's for this instant. */
  crossesDate: boolean;
}

export function dualZoneParts(
  at: string | Date,
  clientTz: string,
  practitionerTz: string,
): DualZoneParts {
  const date = toDate(at);
  const clientTime = formatInZone(date, clientTz);
  const practitionerTime = formatInZone(date, practitionerTz);
  const same =
    clientTz === practitionerTz ||
    tzOffsetMinutes(clientTz, date) === tzOffsetMinutes(practitionerTz, date);
  return {
    clientTime,
    clientZone: zoneAbbreviation(clientTz, date),
    practitionerTime: same ? null : practitionerTime,
    practitionerZone: zoneAbbreviation(practitionerTz, date),
    crossesDate: dateKeyInZone(date, clientTz) !== dateKeyInZone(date, practitionerTz),
  };
}

/**
 * The label every slot carries: `3:00 PM your time · 11:30 PM IST`. When both zones agree it
 * collapses to `11:30 AM IST`; when the practitioner's date differs, her weekday is appended
 * (`… · 12:30 AM IST, Thu`) so a late-night session is never a surprise.
 */
export function dualZoneLabel(
  at: string | Date,
  clientTz: string,
  practitionerTz: string,
  options: { yourTime?: string } = {},
): string {
  const p = dualZoneParts(at, clientTz, practitionerTz);
  if (p.practitionerTime === null) return `${p.clientTime} ${p.clientZone}`;
  const weekday = p.crossesDate
    ? `, ${new Intl.DateTimeFormat("en-GB", { timeZone: practitionerTz, weekday: "short" }).format(toDate(at))}`
    : "";
  return `${p.clientTime} ${options.yourTime ?? "your time"} · ${p.practitionerTime} ${p.practitionerZone}${weekday}`;
}

/** `YYYY-MM-DD` of an instant in a zone. */
export function dateKeyInZone(at: string | Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(toDate(at));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** `YYYY-MM` of a `YYYY-MM-DD` key. */
export const monthKeyOf = (dateKey: string): string => dateKey.slice(0, 7);

/** Shift a `YYYY-MM` key by `n` months (negative allowed). */
export function addMonths(monthKey: string, n: number): string {
  const [y = 0, m = 1] = monthKey.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** `March 2026` for a `YYYY-MM` key. */
export function monthLabel(monthKey: string): string {
  const [y = 0, m = 1] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** `Wednesday 18 March` for a `YYYY-MM-DD` key (a calendar date, so zone-free). */
export function dayLabel(dateKey: string, style: "long" | "short" = "long"): string {
  const [y = 0, m = 1, d = 1] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: style,
    day: "numeric",
    month: style,
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/**
 * The 42 cells of a Monday-first month grid: `YYYY-MM-DD` keys for the month's days, `null`
 * for the leading and trailing blanks. Always six rows so the grid never changes height
 * between months (zero layout shift).
 */
export function monthCells(monthKey: string): (string | null)[] {
  const [y = 0, m = 1] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday = 0
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length < 42) cells.push(null);
  return cells;
}

/** `+9h30 ahead of you` / `1h30 behind you` / `the same time as you` for a pair of zones. */
export function offsetSentence(
  clientTz: string,
  practitionerTz: string,
  at: string | Date,
): string {
  const date = toDate(at);
  const diff = tzOffsetMinutes(practitionerTz, date) - tzOffsetMinutes(clientTz, date);
  if (diff === 0) return "the same time as you";
  const label = formatOffsetLabel(Math.abs(diff)).replace(/^[+−]/, "");
  return diff > 0 ? `${label} ahead of you` : `${label} behind you`;
}

/** `90 min` → `1 h 30 min`; `60` → `1 hour`; `45` → `45 min`. */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h} h ${m} min`;
}

/** Human name for an IANA zone: `America/New_York` → `New York`, `Asia/Kolkata` → `Kolkata`. */
export function zoneCityName(timeZone: string): string {
  const city = timeZone.split("/").pop() ?? timeZone;
  return city.replaceAll("_", " ");
}

/** `America/New_York (EDT)` — the option label in the zone selector. */
export function zoneOptionLabel(timeZone: string, at: string | Date): string {
  return `${zoneCityName(timeZone)} (${zoneAbbreviation(timeZone, at)})`;
}

export { formatOffsetLabel, tzAbbreviation, tzOffsetMinutes };
