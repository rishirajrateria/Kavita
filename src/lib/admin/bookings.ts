/**
 * Booking management (Phase 5 P5-C). List with filters, detail (birth details decrypted
 * server-side ONLY for owner/editor, floor plan as a short-lived signed URL), internal notes and
 * the admin actions: confirm / reschedule / cancel / complete / no-show. Reschedule reuses the
 * Phase 4 slot checks (`slotsAround`, the partial unique index) and `notify()`; every status
 * change writes `booking_status_history` with actor `admin`. Nothing here logs personal data.
 */
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";
import {
  ACTIVE_BOOKING_STATUSES,
  bookingNotes,
  bookingStatusHistory,
  bookings,
  clients,
  floorPlans,
  locations,
  services,
  type AdminRole,
  type Booking,
  type BookingNote,
  type BookingStatus,
  type BookingStatusHistoryEntry,
  type Client,
  type FloorPlan,
  type Service,
  type SiteSettings,
} from "@/db/schema";
import { FLOOR_PLAN_BUCKET } from "@/lib/storage/floor-plans";
import { getServiceClient } from "@/lib/storage/supabase";
import { decryptBirthDetails, type BirthDetails } from "@/lib/crypto/birth-details";
import { slotsAround } from "@/lib/booking/create";
import { isSlotTakenError, type BookingDb } from "@/lib/booking/db";
import { notifyInBackground, type NotifyFn } from "@/lib/booking/notify";
import { loadRelations, loadSettings } from "@/lib/booking/relations";
import { nearestSlots, type Slot } from "@/lib/booking/slots";
import { getTokenSecret, manageTokenExpiry, signManageToken } from "@/lib/booking/tokens";
import type { BookingWithRelations } from "@/lib/notifications/types";
import type { BookingAction, BookingListQuery } from "./manage-schemas";

export type ManageDb = BookingDb;
export const PAGE_SIZE = 25;

/** One list row: booking + the non-sensitive facts of client, service and location. */
export interface BookingListRow {
  booking: Booking;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  serviceSlug: string;
  locationName: string | null;
}

export interface BookingList {
  rows: BookingListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function listWhere(q: BookingListQuery, settingsTz: string): SQL | undefined {
  const where: SQL[] = [];
  if (q.status) where.push(eq(bookings.status, q.status));
  if (q.service) where.push(eq(services.slug, q.service));
  if (q.from) where.push(gte(bookings.startsAt, dayStart(q.from, settingsTz)));
  if (q.to) where.push(lte(bookings.startsAt, dayEnd(q.to, settingsTz)));
  if (q.location) where.push(ilike(locations.path, `${q.location}%`));
  if (q.q) {
    const like = `%${q.q.replace(/[%_]/g, "")}%`;
    where.push(or(ilike(clients.fullName, like), ilike(clients.email, like))!);
  }
  return where.length ? and(...where) : undefined;
}

/** `YYYY-MM-DD` at 00:00 / 23:59:59 in `tz`, via Intl only. */
export function dayStart(date: string, tz: string): Date {
  return zoned(date, "00:00:00", tz);
}
export function dayEnd(date: string, tz: string): Date {
  return zoned(date, "23:59:59", tz);
}
function zoned(date: string, time: string, tz: string): Date {
  const guess = new Date(`${date}T${time}Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(guess);
  const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return new Date(guess.getTime() - (asUtc - guess.getTime()));
}

export async function listBookings(
  db: ManageDb,
  q: BookingListQuery,
  settings: SiteSettings,
): Promise<BookingList> {
  const where = listWhere(q, settings.timezone);
  const base = db
    .select({
      booking: bookings,
      clientName: clients.fullName,
      clientEmail: clients.email,
      serviceName: services.name,
      serviceSlug: services.slug,
      locationName: locations.name,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(locations, eq(locations.id, bookings.locationId))
    .where(where);
  const sortCol = q.sort === "created_at" ? bookings.createdAt : bookings.startsAt;
  const [rows, totalRow] = await Promise.all([
    base
      .orderBy(q.dir === "desc" ? desc(sortCol) : asc(sortCol))
      .limit(PAGE_SIZE)
      .offset((q.page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(bookings)
      .innerJoin(clients, eq(clients.id, bookings.clientId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .leftJoin(locations, eq(locations.id, bookings.locationId))
      .where(where),
  ]);
  const total = Number(totalRow[0]?.n ?? 0);
  return {
    rows,
    total,
    page: q.page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Active + completed bookings in `[from, to]` for the calendar grids (no client contact data). */
export async function listBookingsInRange(
  db: ManageDb,
  from: Date,
  to: Date,
): Promise<BookingListRow[]> {
  return db
    .select({
      booking: bookings,
      clientName: clients.fullName,
      clientEmail: clients.email,
      serviceName: services.name,
      serviceSlug: services.slug,
      locationName: locations.name,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(locations, eq(locations.id, bookings.locationId))
    .where(and(gte(bookings.startsAt, from), lte(bookings.startsAt, to)))
    .orderBy(asc(bookings.startsAt));
}

// --- detail -----------------------------------------------------------------------------------

export type BirthDetailsView =
  | { state: "shown"; details: BirthDetails }
  | { state: "restricted" }
  | { state: "none" }
  | { state: "unavailable" };

export interface BookingDetail {
  relations: BookingWithRelations;
  /** Client row minus the ciphertext — the ciphertext never leaves this module. */
  client: Omit<Client, "birthDetailsEncrypted" | "birthDetailsKeyId">;
  birthDetails: BirthDetailsView;
  floorPlan: { plan: FloorPlan; signedUrl: string | null } | null;
  history: BookingStatusHistoryEntry[];
  notes: BookingNote[];
  payments: { provider: string; status: string; amountMinor: number; currency: string }[];
  isActive: boolean;
}

export const canSeeBirthDetails = (role: AdminRole): boolean =>
  role === "owner" || role === "editor";

function birthDetailsFor(client: Client, role: AdminRole): BirthDetailsView {
  if (!client.birthDetailsEncrypted || !client.birthDetailsKeyId) return { state: "none" };
  if (!canSeeBirthDetails(role)) return { state: "restricted" };
  try {
    return {
      state: "shown",
      details: decryptBirthDetails(client.birthDetailsEncrypted, client.birthDetailsKeyId),
    };
  } catch {
    // Key missing or rotated away: say so, never log the error (it could carry key ids).
    return { state: "unavailable" };
  }
}

/** Signed URL valid for five minutes; `null` when Storage is not configured. */
export async function floorPlanSignedUrl(
  plan: FloorPlan,
  expiresInSeconds = 300,
): Promise<string | null> {
  const client = getServiceClient();
  if (!client) return null;
  const path = plan.storagePath.replace(new RegExp(`^${FLOOR_PLAN_BUCKET}/`), "");
  const { data } = await client.storage
    .from(FLOOR_PLAN_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

export async function getBookingDetail(
  db: ManageDb,
  id: string,
  role: AdminRole,
  deps: { settings?: SiteSettings; signUrl?: typeof floorPlanSignedUrl } = {},
): Promise<BookingDetail | null> {
  const settings = deps.settings ?? (await loadSettings(db));
  const relations = await loadRelations(db, id, settings);
  if (!relations) return null;
  const [history, notes, plans, pays] = await Promise.all([
    db
      .select()
      .from(bookingStatusHistory)
      .where(eq(bookingStatusHistory.bookingId, id))
      .orderBy(asc(bookingStatusHistory.createdAt)),
    db
      .select()
      .from(bookingNotes)
      .where(eq(bookingNotes.bookingId, id))
      .orderBy(asc(bookingNotes.createdAt)),
    db.select().from(floorPlans).where(eq(floorPlans.bookingId, id)).limit(1),
    db.query.payments.findMany({ where: (p, { eq: e }) => e(p.bookingId, id) }),
  ]);
  const { birthDetailsEncrypted: _c, birthDetailsKeyId: _k, ...client } = relations.client;
  void _c;
  void _k;
  const plan = plans[0] ?? null;
  return {
    relations,
    client,
    birthDetails: birthDetailsFor(relations.client, role),
    floorPlan: plan ? { plan, signedUrl: await (deps.signUrl ?? floorPlanSignedUrl)(plan) } : null,
    history,
    notes,
    payments: pays.map((p) => ({
      provider: p.provider,
      status: p.status,
      amountMinor: p.amountMinor,
      currency: p.currency,
    })),
    isActive: (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(relations.booking.status),
  };
}

export async function addBookingNote(
  db: ManageDb,
  bookingId: string,
  adminUserId: string | null,
  body: string,
): Promise<BookingNote> {
  const [row] = await db.insert(bookingNotes).values({ bookingId, adminUserId, body }).returning();
  if (!row) throw new Error("booking note insert returned nothing");
  return row;
}

// --- actions ----------------------------------------------------------------------------------

export type ActionFailure =
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_transition"; from: BookingStatus }
  | { ok: false; reason: "slot_unavailable"; alternatives: Slot[] }
  | { ok: false; reason: "slot_taken"; alternatives: Slot[] };

export type ActionResult = { ok: true; before: Booking; after: Booking } | ActionFailure;

const TRANSITIONS: Record<
  Exclude<BookingAction["action"], "reschedule">,
  readonly BookingStatus[]
> = {
  confirm: ["pending", "awaiting_payment", "payment_pending_offline"],
  cancel: [...ACTIVE_BOOKING_STATUSES],
  complete: [...ACTIVE_BOOKING_STATUSES],
  no_show: [...ACTIVE_BOOKING_STATUSES],
};

const TARGET: Record<Exclude<BookingAction["action"], "reschedule">, BookingStatus> = {
  confirm: "confirmed",
  cancel: "cancelled",
  complete: "completed",
  no_show: "no_show",
};

export interface ActionDeps {
  adminUserId: string | null;
  now?: Date;
  notify?: NotifyFn;
  tokenSecret?: string;
  settings?: SiteSettings;
}

export async function applyBookingAction(
  db: ManageDb,
  id: string,
  action: BookingAction,
  deps: ActionDeps,
): Promise<ActionResult> {
  const settings = deps.settings ?? (await loadSettings(db));
  const relations = await loadRelations(db, id, settings);
  if (!relations) return { ok: false, reason: "not_found" };
  if (action.action === "reschedule") return rescheduleAsAdmin(db, relations, action, deps);
  const old = relations.booking;
  if (!TRANSITIONS[action.action].includes(old.status)) {
    return { ok: false, reason: "invalid_transition", from: old.status };
  }
  const to = TARGET[action.action];
  const reason = action.action === "cancel" ? action.reason : null;
  const after = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(bookings)
      .set({ status: to })
      .where(eq(bookings.id, old.id))
      .returning();
    if (!row) throw new Error("booking update returned nothing");
    await tx.insert(bookingStatusHistory).values({
      bookingId: old.id,
      fromStatus: old.status,
      toStatus: to,
      changedBy: "admin",
      adminUserId: deps.adminUserId,
      reason,
    });
    return row;
  });
  if (action.action === "cancel" && action.notifyClient) {
    notifyInBackground(deps.notify, "cancellation", {
      ...relations,
      booking: after,
      cancellationReason: reason,
    });
  }
  return { ok: true, before: old, after };
}

/** Admin reschedule: no notice period, but the slot must be free (rules, exceptions, bookings). */
async function rescheduleAsAdmin(
  db: ManageDb,
  relations: BookingWithRelations,
  action: Extract<BookingAction, { action: "reschedule" }>,
  deps: ActionDeps,
): Promise<ActionResult> {
  const { booking: old, service, settings } = relations;
  if (!(ACTIVE_BOOKING_STATUSES as readonly string[]).includes(old.status)) {
    return { ok: false, reason: "invalid_transition", from: old.status };
  }
  const now = deps.now ?? new Date();
  const startsAt = action.startsAt;
  const iso = startsAt.toISOString();
  const slots = (await slotsAround(db, service, settings, startsAt, now)).filter(
    (s) => s.startsAt !== old.startsAt.toISOString(),
  );
  if (!slots.some((s) => s.startsAt === iso)) {
    return { ok: false, reason: "slot_unavailable", alternatives: nearestSlots(slots, startsAt) };
  }
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const newId = randomUUID();
  const newToken = signManageToken(
    newId,
    manageTokenExpiry(now),
    deps.tokenSecret ?? getTokenSecret(),
  );
  let created: Booking;
  try {
    created = await db.transaction(async (tx) => {
      await tx.update(bookings).set({ status: "rescheduled" }).where(eq(bookings.id, old.id));
      await tx.insert(bookingStatusHistory).values({
        bookingId: old.id,
        fromStatus: old.status,
        toStatus: "rescheduled",
        changedBy: "admin",
        adminUserId: deps.adminUserId,
        reason: `Moved to ${iso}`,
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
          clientTimezone: old.clientTimezone,
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
        changedBy: "admin",
        adminUserId: deps.adminUserId,
        reason: `Rescheduled by admin from ${old.startsAt.toISOString()}`,
      });
      // Notes follow the booking so the thread is not lost.
      await tx
        .update(bookingNotes)
        .set({ bookingId: newId })
        .where(eq(bookingNotes.bookingId, old.id));
      return row;
    });
  } catch (error) {
    if (isSlotTakenError(error)) {
      const fresh = await slotsAround(db, service, settings, startsAt, now);
      return {
        ok: false,
        reason: "slot_taken",
        alternatives: nearestSlots(
          fresh.filter((s) => s.startsAt !== iso),
          startsAt,
        ),
      };
    }
    throw error;
  }
  if (action.notifyClient) {
    notifyInBackground(deps.notify, "reschedule", {
      ...relations,
      booking: created,
      previous: { startsAt: old.startsAt, endsAt: old.endsAt },
    });
  }
  return { ok: true, before: old, after: created };
}

/** Services referenced by at least one booking — the filter dropdown. */
export async function bookingServiceOptions(
  db: ManageDb,
): Promise<Pick<Service, "slug" | "name">[]> {
  return db
    .select({ slug: services.slug, name: services.name })
    .from(services)
    .orderBy(asc(services.sortOrder));
}

/** Counts per status for the list header chips. */
export async function bookingStatusCounts(
  db: ManageDb,
): Promise<Partial<Record<BookingStatus, number>>> {
  const rows = await db
    .select({ status: bookings.status, n: count() })
    .from(bookings)
    .groupBy(bookings.status);
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}

export { inArray };
