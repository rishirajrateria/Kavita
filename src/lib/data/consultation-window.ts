/**
 * Pure (no DB, no React) consultation-window maths so it can be unit-tested with tsx.
 *
 * Given a location's IANA timezone and the practitioner's timezone + business hours, work out
 * today's offset between the two and the hours a live session can realistically happen in the
 * client's local time: the practitioner's working day shifted into the client's zone, then
 * intersected with a client-friendly 07:00–22:00. Offsets are computed for a real date (today by
 * default) so DST on either side is handled by Intl, never by a hand-maintained table.
 */
import type { BusinessHours, Weekday } from "@/db/schema";

export type ConsultationWindow = {
  /** Location minus practitioner, in minutes; +270 = the client is 4h30 ahead. */
  offsetMinutesFromPractitioner: number;
  /** "+4h30", "−1h30" or "same time". */
  offsetLabel: string;
  /** e.g. "9:00–17:30 local" — the overlap in the client's clock. */
  localWindow: string;
  /** e.g. "10:00–18:00 IST" — the practitioner's working day in her own clock. */
  practitionerWindow: string;
  /** Local start/end as HH:MM, for programmatic use; null when there is no daytime overlap. */
  localStart: string | null;
  localEnd: string | null;
  note?: string;
};

export type ConsultationWindowSettings = {
  timezone: string;
  businessHours?: BusinessHours | null;
};

/** Practitioner hours assumed when `site_settings.business_hours` is absent or fully closed. */
export const ASSUMED_PRACTITIONER_HOURS = { open: "09:00", close: "20:00" } as const;
/** Hours a client is realistically willing to take a live session. */
export const CLIENT_FRIENDLY_HOURS = { open: "07:00", close: "22:00" } as const;
const MIN_OVERLAP_MINUTES = 60;
const DAY = 24 * 60;

const WEEKDAYS: readonly Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** UTC offset of `timeZone` at `at`, in minutes (east positive). */
export function tzOffsetMinutes(timeZone: string, at: Date): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(part ?? "");
  if (!m) throw new Error(`Cannot determine UTC offset for ${timeZone}`);
  if (!m[1]) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Short zone label, preferring a real abbreviation (IST, GST, BST, EDT) over "GMT+5:30". */
export function tzAbbreviation(timeZone: string, at: Date): string {
  let fallback = "";
  for (const locale of ["en-IN", "en-GB", "en-US", "en-AU", "en-AE", "en-SG", "en-CA"]) {
    const value = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
    if (!value) continue;
    if (!/^(GMT|UTC)/.test(value)) return value;
    fallback ||= value;
  }
  return fallback || timeZone;
}

export function formatOffsetLabel(minutes: number): string {
  if (minutes === 0) return "same time";
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${m ? String(m).padStart(2, "0") : ""}`;
}

const toMinutes = (hhmm: string): number => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (minutes: number): string => {
  const norm = ((minutes % DAY) + DAY) % DAY;
  return `${Math.floor(norm / 60)}:${String(norm % 60).padStart(2, "0")}`;
};
const fmtPadded = (minutes: number): string => {
  const norm = ((minutes % DAY) + DAY) % DAY;
  return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}`;
};

/** The practitioner's typical day: earliest open to latest close across all open weekdays. */
export function practitionerDay(hours: BusinessHours | null | undefined): {
  open: number;
  close: number;
  assumed: boolean;
} {
  let open = Infinity;
  let close = -Infinity;
  if (hours) {
    for (const day of WEEKDAYS) {
      for (const slot of hours[day] ?? []) {
        open = Math.min(open, toMinutes(slot.open));
        close = Math.max(close, toMinutes(slot.close));
      }
    }
  }
  if (open === Infinity || close <= open) {
    return {
      open: toMinutes(ASSUMED_PRACTITIONER_HOURS.open),
      close: toMinutes(ASSUMED_PRACTITIONER_HOURS.close),
      assumed: true,
    };
  }
  return { open, close, assumed: false };
}

/** Longest overlap between [start, end) shifted by `offset` (may cross midnight) and [lo, hi). */
function bestOverlap(
  start: number,
  end: number,
  lo: number,
  hi: number,
): { start: number; end: number } | null {
  // Consider the shifted window in the previous, same and next local day.
  let best: { start: number; end: number } | null = null;
  for (const shift of [-DAY, 0, DAY]) {
    const s = Math.max(start + shift, lo);
    const e = Math.min(end + shift, hi);
    if (e - s > (best ? best.end - best.start : 0)) best = { start: s, end: e };
  }
  return best && best.end - best.start > 0 ? best : null;
}

export function computeConsultationWindowFor(
  location: { timezone: string },
  settings: ConsultationWindowSettings,
  now: Date = new Date(),
): ConsultationWindow {
  const offset = tzOffsetMinutes(location.timezone, now) - tzOffsetMinutes(settings.timezone, now);
  const day = practitionerDay(settings.businessHours);
  const abbr = tzAbbreviation(settings.timezone, now);
  const practitionerWindow = `${fmt(day.open)}–${fmt(day.close)} ${abbr}`;
  const notes: string[] = [];
  if (day.assumed) {
    notes.push(
      `Practitioner hours are not yet confirmed; ${ASSUMED_PRACTITIONER_HOURS.open}–${ASSUMED_PRACTITIONER_HOURS.close} ${abbr} is assumed.`,
    );
  }

  const shiftedStart = day.open + offset;
  const shiftedEnd = day.close + offset;
  let overlap = bestOverlap(
    shiftedStart,
    shiftedEnd,
    toMinutes(CLIENT_FRIENDLY_HOURS.open),
    toMinutes(CLIENT_FRIENDLY_HOURS.close),
  );
  if (!overlap || overlap.end - overlap.start < MIN_OVERLAP_MINUTES) {
    // Widen to early morning / late evening before giving up.
    const wide = bestOverlap(shiftedStart, shiftedEnd, 6 * 60, 23 * 60);
    if (wide && wide.end - wide.start >= MIN_OVERLAP_MINUTES) {
      overlap = wide;
      notes.push("Sessions fall in the early morning or late evening in your local time.");
    } else {
      notes.push(
        `Her working day is ${fmt(shiftedStart)}–${fmt(shiftedEnd)} in your local time; sessions are arranged individually outside her usual hours.`,
      );
      return {
        offsetMinutesFromPractitioner: offset,
        offsetLabel: formatOffsetLabel(offset),
        localWindow: "by arrangement",
        practitionerWindow,
        localStart: null,
        localEnd: null,
        note: notes.join(" "),
      };
    }
  }
  return {
    offsetMinutesFromPractitioner: offset,
    offsetLabel: formatOffsetLabel(offset),
    localWindow: `${fmt(overlap.start)}–${fmt(overlap.end)} local`,
    practitionerWindow,
    localStart: fmtPadded(overlap.start),
    localEnd: fmtPadded(overlap.end),
    ...(notes.length ? { note: notes.join(" ") } : {}),
  };
}
