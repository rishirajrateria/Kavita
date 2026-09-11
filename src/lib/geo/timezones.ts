/**
 * IANA time-zone arithmetic with `Intl` only — no library, no invented facts. Used by the
 * country time-zone table and the key-facts band. Everything here is computed from the zone
 * database the runtime ships, so it is as accurate as the Node/ICU build that rendered the page.
 */

/** UTC offset of `timeZone` at `at`, in minutes (east positive). */
export function utcOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? "0");
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

/** `+5:30`, `-4:00`, `±0:00` style label for a minute offset. */
export function formatOffset(minutes: number, { zeroLabel = "same time" } = {}): string {
  if (minutes === 0) return zeroLabel;
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${sign}${h}h` : `${sign}${h}h${String(m).padStart(2, "0")}`;
}

/** `UTC+04:00` label for a zone at a date. */
export function utcLabel(timeZone: string, at: Date = new Date()): string {
  const minutes = utcOffsetMinutes(timeZone, at);
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** Short zone abbreviation as ICU knows it (`IST`, `GMT+4`, `EDT`). */
export function zoneAbbreviation(timeZone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(
    at,
  );
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

/** True when the zone's offset differs between January and July of `year` (observes DST). */
export function observesDst(timeZone: string, year: number = new Date().getUTCFullYear()): boolean {
  const jan = utcOffsetMinutes(timeZone, new Date(Date.UTC(year, 0, 1, 12)));
  const jul = utcOffsetMinutes(timeZone, new Date(Date.UTC(year, 6, 1, 12)));
  return jan !== jul;
}

/** Difference `zone − reference` in minutes at `at`. Positive = the zone is ahead. */
export function offsetBetween(zone: string, reference: string, at: Date = new Date()): number {
  return utcOffsetMinutes(zone, at) - utcOffsetMinutes(reference, at);
}

/** `"10:00"` → minutes since midnight. */
export function parseClock(hhmm: string): number {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** Minutes since midnight → `"9:30"` (24-hour, no leading zero on the hour). */
export function formatClock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${Math.floor(wrapped / 60)}:${String(wrapped % 60).padStart(2, "0")}`;
}

/** Shift a `HH:MM` clock time by `deltaMinutes`, wrapping past midnight, with a day marker. */
export function shiftClock(
  hhmm: string,
  deltaMinutes: number,
): { time: string; dayShift: -1 | 0 | 1 } {
  const total = parseClock(hhmm) + deltaMinutes;
  const dayShift: -1 | 0 | 1 = total < 0 ? -1 : total >= 1440 ? 1 : 0;
  return { time: formatClock(total), dayShift };
}
