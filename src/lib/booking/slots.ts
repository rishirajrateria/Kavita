/**
 * Pure slot generator — the heart of the booking engine. Deterministic: every input, including
 * `now`, is a parameter; nothing here touches a database, `Date.now()` or the process timezone.
 *
 * Timezone model (Phase 4 contract): availability rules are wall-clock times in the
 * practitioner's IANA zone; every output instant is UTC ISO. Wall-clock → instant conversion goes
 * through `TZDate` from `@date-fns/tz`, which resolves DST for the zone on that calendar day, so
 * "10:00 in Europe/London" is 10:00Z in winter and 09:00Z in summer without any manual offsets.
 */
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

export interface Slot {
  /** ISO 8601 UTC instant, e.g. `2026-10-05T04:30:00.000Z`. */
  startsAt: string;
  endsAt: string;
}

export interface SlotService {
  id?: string | null;
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

export interface SlotRule {
  /** 0 = Sunday … 6 = Saturday, in the practitioner's zone. */
  weekday: number;
  /** `HH:MM` wall-clock in the practitioner's zone; `24:00` means end of day. */
  startTime: string;
  endTime: string;
  /** Null = applies to every service. */
  serviceId?: string | null;
  isActive?: boolean;
}

export interface SlotException {
  startsAt: Date;
  endsAt: Date;
  /** `true` blocks the range; `false` opens it in addition to the rules. */
  isBlocked: boolean;
}

export interface SlotBooking {
  startsAt: Date;
  endsAt: Date;
}

export interface GenerateSlotsInput {
  service: SlotService;
  rules: readonly SlotRule[];
  exceptions?: readonly SlotException[];
  /** Active bookings (statuses that hold a slot). */
  bookings?: readonly SlotBooking[];
  practitionerTz: string;
  /** Inclusive lower bound of the range being asked for (any zone — it is an instant). */
  from: Date;
  /** Exclusive upper bound. */
  to: Date;
  now: Date;
  leadTimeHours: number;
  horizonDays: number;
  stepMinutes: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `"HH:MM"` → `[hours, minutes]`; throws on malformed input so bad admin data fails loudly. */
export function parseHHMM(value: string): [number, number] {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) throw new Error(`Invalid time "${value}" — expected HH:MM`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) {
    throw new Error(`Invalid time "${value}" — expected 00:00–24:00`);
  }
  return [hours, minutes];
}

/** The instant at `HH:MM` on the calendar day of `day` (a TZDate in the practitioner's zone). */
export function wallClockInstant(day: TZDate, hhmm: string, tz: string): number {
  const [hours, minutes] = parseHHMM(hhmm);
  return new TZDate(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
    tz,
  ).getTime();
}

/** `YYYY-MM-DD` of an instant in `tz`. */
export function localDateKey(instant: Date | string | number, tz: string): string {
  const d = new TZDate(new Date(instant).getTime(), tz);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Group slots by the calendar date they fall on in `tz` (the client's zone for the UI). */
export function groupSlotsByLocalDate(
  slots: readonly Slot[],
  tz: string,
): { date: string; slots: Slot[] }[] {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = localDateKey(slot.startsAt, tz);
    const list = map.get(key);
    if (list) list.push(slot);
    else map.set(key, [slot]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, list]) => ({ date, slots: list }));
}

interface Window {
  start: number;
  end: number;
}

function ruleWindows(input: GenerateSlotsInput): Window[] {
  const { rules, practitionerTz: tz, service } = input;
  const active = rules.filter(
    (r) =>
      r.isActive !== false &&
      (r.serviceId == null || service.id == null || r.serviceId === service.id),
  );
  if (active.length === 0) return [];

  // Walk practitioner-local calendar days one beyond each end of the range: a client-zone month
  // boundary can sit in the middle of a practitioner-zone day.
  const first = new TZDate(input.from.getTime(), tz);
  const firstMidnight = new TZDate(first.getFullYear(), first.getMonth(), first.getDate(), tz);
  const dayCount = Math.ceil((input.to.getTime() - input.from.getTime()) / DAY) + 2;
  const windows: Window[] = [];
  for (let i = -1; i < dayCount; i++) {
    const day = addDays(firstMidnight, i);
    const weekday = day.getDay();
    for (const rule of active) {
      if (rule.weekday !== weekday) continue;
      const start = wallClockInstant(day, rule.startTime, tz);
      const end = wallClockInstant(day, rule.endTime, tz);
      if (end > start) windows.push({ start, end });
    }
  }
  return windows;
}

/**
 * Every bookable slot start in `[from, to)`, honouring lead time, horizon, blocked ranges,
 * extra openings and existing bookings (with the service's buffers). Sorted, de-duplicated.
 */
export function generateSlots(input: GenerateSlotsInput): Slot[] {
  const duration = input.service.durationMinutes * MINUTE;
  // A session needs `before` free minutes ahead of it and `after` behind it, and so does every
  // existing booking (approximated with this service's values): the required gap on either side
  // of an existing booking is therefore `before + after`.
  const gap =
    ((input.service.bufferBeforeMinutes ?? 0) + (input.service.bufferAfterMinutes ?? 0)) * MINUTE;
  const step = Math.max(5, input.stepMinutes) * MINUTE;
  if (!(duration > 0)) return [];

  const earliest = Math.max(input.from.getTime(), input.now.getTime() + input.leadTimeHours * HOUR);
  const latest = Math.min(input.to.getTime(), input.now.getTime() + input.horizonDays * DAY);
  if (earliest >= latest) return [];

  const exceptions = input.exceptions ?? [];
  const blocked = exceptions.filter((e) => e.isBlocked);
  const windows = [
    ...ruleWindows(input),
    ...exceptions
      .filter((e) => !e.isBlocked)
      .map((e) => ({ start: e.startsAt.getTime(), end: e.endsAt.getTime() })),
  ];
  const bookings = input.bookings ?? [];

  const starts = new Set<number>();
  for (const window of windows) {
    for (let t = window.start; t + duration <= window.end; t += step) {
      if (t < earliest || t >= latest) continue;
      const end = t + duration;
      if (blocked.some((b) => b.startsAt.getTime() < end && b.endsAt.getTime() > t)) continue;
      if (bookings.some((b) => b.startsAt.getTime() < end + gap && b.endsAt.getTime() > t - gap)) {
        continue;
      }
      starts.add(t);
    }
  }

  return [...starts]
    .sort((a, b) => a - b)
    .map((t) => ({
      startsAt: new Date(t).toISOString(),
      endsAt: new Date(t + duration).toISOString(),
    }));
}

/** The `n` available slots closest in time to `target` — offered when a slot was just taken. */
export function nearestSlots(slots: readonly Slot[], target: Date, n = 3): Slot[] {
  const t = target.getTime();
  return [...slots]
    .filter((s) => s.startsAt !== target.toISOString())
    .sort(
      (a, b) =>
        Math.abs(new Date(a.startsAt).getTime() - t) - Math.abs(new Date(b.startsAt).getTime() - t),
    )
    .slice(0, n)
    .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
}
