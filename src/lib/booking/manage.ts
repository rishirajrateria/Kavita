/**
 * Self-service management by token: view, reschedule (notice period enforced; the old booking
 * becomes `rescheduled` and a new row carries `rescheduled_from_id`) and cancel. Every state
 * change writes `booking_status_history` with actor `client`.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ACTIVE_BOOKING_STATUSES,
  bookingStatusHistory,
  bookings,
  type Booking,
  type BookingStatus,
} from "@/db/schema";
import type { BookingWithRelations } from "@/lib/notifications/types";
import type { BookingDeps } from "./create";
import { fieldErrorsOf, slotsAround } from "./create";
import { isSlotTakenError, type BookingDb } from "./db";
import { notifyInBackground } from "./notify";
import { loadRelations, loadSettings } from "./relations";
import { cancelSchema, rescheduleSchema } from "./schemas";
import { nearestSlots, type Slot } from "./slots";
import { getTokenSecret, manageTokenExpiry, signManageToken, verifyManageToken } from "./tokens";

const HOUR_MS = 60 * 60 * 1000;

export type ManageFailure =
  | { ok: false; reason: "not_connected" }
  | { ok: false; reason: "invalid_token" }
  | { ok: false; reason: "expired" }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "not_active"; status: BookingStatus }
  | { ok: false; reason: "notice_period"; noticeHours: number }
  | { ok: false; reason: "validation"; errors: Record<string, string[]> }
  | { ok: false; reason: "slot_unavailable"; alternatives: Slot[] }
  | { ok: false; reason: "slot_taken"; alternatives: Slot[] };

export interface ManagedBooking {
  ok: true;
  relations: BookingWithRelations;
  /** True while the booking holds a slot (see `ACTIVE_BOOKING_STATUSES`). */
  isActive: boolean;
  /** True when a client may still move the session (active and outside the notice period). */
  canReschedule: boolean;
  canCancel: boolean;
  /** Last instant at which self-service reschedule is allowed. */
  rescheduleDeadline: Date;
  noticeHours: number;
}

export type ManageResult = ManagedBooking | ManageFailure;

function isActiveStatus(status: BookingStatus): boolean {
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status);
}

async function resolve(
  token: string,
  deps: BookingDeps,
): Promise<{ db: BookingDb; relations: BookingWithRelations; now: Date } | ManageFailure> {
  const db = deps.db !== undefined ? deps.db : getDb();
  if (!db) return { ok: false, reason: "not_connected" };
  const now = deps.now ?? new Date();
  const verified = verifyManageToken(token, { now, secret: deps.tokenSecret ?? getTokenSecret() });
  if (!verified.ok) {
    return { ok: false, reason: verified.reason === "expired" ? "expired" : "invalid_token" };
  }
  const settings = deps.settings ?? (await loadSettings(db));
  const relations = await loadRelations(db, verified.bookingId, settings);
  // The stored token must match too: a rescheduled booking's old link is dead even if unexpired.
  if (!relations || relations.booking.manageToken !== token)
    return { ok: false, reason: "not_found" };
  return { db, relations, now };
}

function describe(relations: BookingWithRelations, now: Date): ManagedBooking {
  const noticeHours = relations.settings.rescheduleNoticeHours;
  const deadline = new Date(relations.booking.startsAt.getTime() - noticeHours * HOUR_MS);
  const isActive = isActiveStatus(relations.booking.status);
  return {
    ok: true,
    relations,
    isActive,
    canReschedule: isActive && now.getTime() < deadline.getTime(),
    canCancel: isActive && now.getTime() < relations.booking.startsAt.getTime(),
    rescheduleDeadline: deadline,
    noticeHours,
  };
}

export async function getBookingByToken(
  token: string,
  deps: BookingDeps = {},
): Promise<ManageResult> {
  const r = await resolve(token, deps);
  if ("ok" in r) return r;
  return describe(r.relations, r.now);
}

export type RescheduleResult =
  { ok: true; relations: BookingWithRelations; previous: Booking } | ManageFailure;

export async function rescheduleBooking(
  token: string,
  input: unknown,
  deps: BookingDeps = {},
): Promise<RescheduleResult> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, reason: "validation", errors: fieldErrorsOf(parsed.error) };
  const r = await resolve(token, deps);
  if ("ok" in r) return r;
  const { db, relations, now } = r;
  const current = describe(relations, now);
  if (!current.isActive)
    return { ok: false, reason: "not_active", status: relations.booking.status };
  if (!current.canReschedule)
    return { ok: false, reason: "notice_period", noticeHours: current.noticeHours };

  const { booking: old, service, settings } = relations;
  const startsAt = new Date(parsed.data.startsAt);
  // The old booking still holds its slot while we check, so exclude it from the conflict set by
  // asking for slots as if it were free: its own start is the only one it can collide with.
  const slots = (await slotsAround(db, service, settings, startsAt, now)).filter(
    (s) => s.startsAt !== old.startsAt.toISOString(),
  );
  if (!slots.some((s) => s.startsAt === parsed.data.startsAt)) {
    return { ok: false, reason: "slot_unavailable", alternatives: nearestSlots(slots, startsAt) };
  }
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const newId = randomUUID();
  const newToken = signManageToken(
    newId,
    manageTokenExpiry(now),
    deps.tokenSecret ?? getTokenSecret(),
  );
  const clientTimezone = parsed.data.clientTimezone ?? old.clientTimezone;

  let created: Booking;
  try {
    created = await db.transaction(async (tx) => {
      await tx.update(bookings).set({ status: "rescheduled" }).where(eq(bookings.id, old.id));
      await tx.insert(bookingStatusHistory).values({
        bookingId: old.id,
        fromStatus: old.status,
        toStatus: "rescheduled",
        changedBy: "client",
        reason: `Moved to ${startsAt.toISOString()}`,
      });
      const [row] = await tx
        .insert(bookings)
        .values({
          id: newId,
          clientId: old.clientId,
          serviceId: old.serviceId,
          locationId: old.locationId,
          startsAt,
          endsAt,
          clientTimezone,
          mode: old.mode,
          status: old.status,
          clientNotes: old.clientNotes,
          manageToken: newToken,
          rescheduledFromId: old.id,
        })
        .returning();
      if (!row) throw new Error("reschedule insert returned nothing");
      await tx.insert(bookingStatusHistory).values({
        bookingId: newId,
        fromStatus: null,
        toStatus: old.status,
        changedBy: "client",
        reason: `Rescheduled from ${old.startsAt.toISOString()}`,
      });
      return row;
    });
  } catch (error) {
    if (isSlotTakenError(error)) {
      const fresh = await slotsAround(db, service, settings, startsAt, now);
      return {
        ok: false,
        reason: "slot_taken",
        alternatives: nearestSlots(
          fresh.filter((s) => s.startsAt !== parsed.data.startsAt),
          startsAt,
        ),
      };
    }
    throw error;
  }

  const next: BookingWithRelations = {
    ...relations,
    booking: created,
    previous: { startsAt: old.startsAt, endsAt: old.endsAt },
  };
  notifyInBackground(deps.notify, "reschedule", next);
  return { ok: true, relations: next, previous: old };
}

export type CancelResult = { ok: true; relations: BookingWithRelations } | ManageFailure;

export async function cancelBooking(
  token: string,
  input: unknown = {},
  deps: BookingDeps = {},
): Promise<CancelResult> {
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, reason: "validation", errors: fieldErrorsOf(parsed.error) };
  const r = await resolve(token, deps);
  if ("ok" in r) return r;
  const { db, relations, now } = r;
  const current = describe(relations, now);
  if (!current.isActive)
    return { ok: false, reason: "not_active", status: relations.booking.status };
  const old = relations.booking;
  const reason = parsed.data.reason ?? null;

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, old.id))
      .returning();
    if (!row) throw new Error("cancel update returned nothing");
    await tx.insert(bookingStatusHistory).values({
      bookingId: old.id,
      fromStatus: old.status,
      toStatus: "cancelled",
      changedBy: "client",
      reason: current.canCancel ? reason : `Late cancellation. ${reason ?? ""}`.trim(),
    });
    return row;
  });

  const next: BookingWithRelations = { ...relations, booking: updated, cancellationReason: reason };
  notifyInBackground(deps.notify, "cancellation", next);
  return { ok: true, relations: next };
}
