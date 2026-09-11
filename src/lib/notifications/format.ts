/**
 * Instant → human text in a named zone, for emails. Everything comes from `Intl` with the IANA
 * zone, so DST on either end is the runtime's job, never ours. Zone names are spelled out
 * ("India Standard Time", "British Summer Time") because an abbreviation alone is ambiguous
 * across the site's markets (IST is India and Ireland; CST is three places).
 */

export interface ZonedDescription {
  /** IANA zone, e.g. `America/New_York`. */
  zone: string;
  /** Spelled-out name at that instant, e.g. `Eastern Daylight Time`. */
  zoneName: string;
  /** `Tuesday 15 September 2026`. */
  date: string;
  /** `7:30 pm`. */
  time: string;
  /** `Tuesday 15 September 2026, 7:30 pm`. */
  label: string;
  /** `Tuesday 15 September 2026, 7:30 pm (India Standard Time)`. */
  full: string;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/** Spelled-out zone name at `at`; falls back to the IANA id when ICU has no name. */
export function zoneLongName(zone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "long" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  return parts && parts.trim().length > 0 ? parts : zone;
}

/** Describe one instant in one zone. Throws on an invalid zone, as `Intl` does. */
export function describeInstant(at: Date, zone: string): ZonedDescription {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(at);
  const date = `${part(parts, "weekday")} ${part(parts, "day")} ${part(parts, "month")} ${part(parts, "year")}`;
  const dayPeriod = part(parts, "dayPeriod").toLowerCase().replace(/\./g, "");
  const time = `${part(parts, "hour")}:${part(parts, "minute")} ${dayPeriod}`.trim();
  const zoneName = zoneLongName(zone, at);
  const label = `${date}, ${time}`;
  return { zone, zoneName, date, time, label, full: `${label} (${zoneName})` };
}

/** `90 minutes` / `1 hour` / `1 hour 30 minutes`. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(" ") : "0 minutes";
}

/** Booking modes as a person reads them. */
export function formatMode(mode: string): string {
  switch (mode) {
    case "online_video":
      return "Video call";
    case "online_phone":
      return "Phone call";
    case "in_person":
      return "In person";
    default:
      return mode.replace(/_/g, " ");
  }
}

/** First name for a greeting, or the whole name when it has no space. */
export function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  const first = trimmed.split(/\s+/)[0];
  return first && first.length > 0 ? first : trimmed;
}
