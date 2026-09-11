/**
 * Availability for the calendar: rules, exceptions and active bookings from the database (seed
 * rules when there is no database or the table is empty), run through the pure slot generator,
 * grouped by the client's local calendar date. Exposes nothing but free slots — never who holds
 * a taken one.
 */
import { TZDate } from "@date-fns/tz";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ACTIVE_BOOKING_STATUSES,
  availabilityExceptions,
  availabilityRules,
  bookings,
  type Service,
  type SiteSettings,
} from "@/db/schema";
import { AVAILABILITY_SEED_IS_PLACEHOLDER, availabilityRulesSeed } from "@/content/seed";
import { getServiceBySlug, getSiteSettings } from "@/lib/data";
import type { BookingDb } from "./db";
import {
  generateSlots,
  groupSlotsByLocalDate,
  type Slot,
  type SlotBooking,
  type SlotException,
  type SlotRule,
} from "./slots";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AvailabilityContext {
  rules: SlotRule[];
  exceptions: SlotException[];
  bookings: SlotBooking[];
  /** True when the seed rules (unconfirmed hours) were used. */
  placeholderRules: boolean;
}

/** Rules, exceptions and active bookings overlapping `[from − 1d, to + 1d]`. */
export async function loadAvailabilityContext(
  db: BookingDb | null,
  range: { from: Date; to: Date },
): Promise<AvailabilityContext> {
  const seed = { rules: availabilityRulesSeed as SlotRule[], placeholderRules: true };
  if (!db) return { ...seed, exceptions: [], bookings: [] };
  const lo = new Date(range.from.getTime() - DAY_MS);
  const hi = new Date(range.to.getTime() + DAY_MS);
  const [rules, exceptions, active] = await Promise.all([
    db.select().from(availabilityRules).where(eq(availabilityRules.isActive, true)),
    db
      .select()
      .from(availabilityExceptions)
      .where(and(lt(availabilityExceptions.startsAt, hi), gt(availabilityExceptions.endsAt, lo))),
    db
      .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
      .from(bookings)
      .where(
        and(
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
          lt(bookings.startsAt, hi),
          gt(bookings.endsAt, lo),
        ),
      ),
  ]);
  return {
    rules: rules.length > 0 ? rules : seed.rules,
    placeholderRules: rules.length === 0 && AVAILABILITY_SEED_IS_PLACEHOLDER,
    exceptions,
    bookings: active,
  };
}

export interface SlotRangeInput {
  service: Service;
  settings: SiteSettings;
  context: AvailabilityContext;
  from: Date;
  to: Date;
  now: Date;
}

/** Free slots for a service in a range, applying the site's booking settings. */
export function slotsForRange(input: SlotRangeInput): Slot[] {
  const { service, settings, context } = input;
  return generateSlots({
    service: {
      id: service.id,
      durationMinutes: service.durationMinutes,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
    },
    rules: context.rules,
    exceptions: context.exceptions,
    bookings: context.bookings,
    practitionerTz: settings.timezone,
    from: input.from,
    to: input.to,
    now: input.now,
    leadTimeHours: settings.leadTimeHours,
    horizonDays: settings.horizonDays,
    stepMinutes: settings.slotStepMinutes,
  });
}

/** `[first instant of the month, first instant of the next month)` in `tz`. */
export function monthRange(monthISO: string, tz: string): { from: Date; to: Date } {
  const [y, m] = monthISO.split("-").map(Number) as [number, number];
  const from = new TZDate(y, m - 1, 1, 0, 0, 0, 0, tz);
  const to =
    m === 12 ? new TZDate(y + 1, 0, 1, 0, 0, 0, 0, tz) : new TZDate(y, m, 1, 0, 0, 0, 0, tz);
  return { from: new Date(from.getTime()), to: new Date(to.getTime()) };
}

export interface AvailabilityInput {
  serviceSlug: string;
  /** `YYYY-MM`, interpreted in `clientTz`. */
  monthISO: string;
  clientTz: string;
  now?: Date;
  /** Injection points for tests; the app resolves them itself. */
  db?: BookingDb | null;
  settings?: SiteSettings;
  service?: Service | null;
}

export interface Availability {
  serviceSlug: string;
  month: string;
  practitionerTz: string;
  clientTz: string;
  durationMinutes: number;
  stepMinutes: number;
  /** Client-local calendar days that have at least one free slot. */
  days: { date: string; slots: Slot[] }[];
  /** True while the practitioner's hours are the unconfirmed seed defaults. */
  placeholderRules: boolean;
}

/** `null` when the service does not exist or is inactive. */
export async function getAvailability(input: AvailabilityInput): Promise<Availability | null> {
  const service =
    input.service !== undefined ? input.service : await getServiceBySlug(input.serviceSlug);
  if (!service) return null;
  const settings = input.settings ?? (await getSiteSettings());
  const db = input.db !== undefined ? input.db : getDb();
  const now = input.now ?? new Date();
  const { from, to } = monthRange(input.monthISO, input.clientTz);
  const context = await loadAvailabilityContext(db, { from, to });
  const slots = slotsForRange({ service, settings, context, from, to, now });
  return {
    serviceSlug: service.slug,
    month: input.monthISO,
    practitionerTz: settings.timezone,
    clientTz: input.clientTz,
    durationMinutes: service.durationMinutes,
    stepMinutes: settings.slotStepMinutes,
    days: groupSlotsByLocalDate(slots, input.clientTz),
    placeholderRules: context.placeholderRules,
  };
}
