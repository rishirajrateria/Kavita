/**
 * `createBooking()` — validate, re-check the slot against live availability, then write client
 * + booking + history (+ payment) in ONE transaction. The partial unique index on
 * `bookings(starts_at)` is the final arbiter of a race: the loser gets `slot_taken` and the
 * nearest free alternatives. Personal data is never logged; birth details are encrypted before
 * the insert.
 */
import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookingStatusHistory,
  bookings,
  clients,
  floorPlans,
  payments,
  type Booking,
  type Client,
  type Service,
  type SiteSettings,
} from "@/db/schema";
import { getServiceBySlug, getSiteSettings } from "@/lib/data";
import { encryptBirthDetails, loadKeyring, type Keyring } from "@/lib/crypto/birth-details";
import { track } from "@/lib/events";
import type { BookingWithRelations } from "@/lib/notifications/types";
import {
  getPaymentProvider,
  initialBookingStatus,
  isPaymentsEnabled,
  type PaymentProvider,
} from "@/lib/payments";
import { loadAvailabilityContext, slotsForRange } from "./availability";
import { isSlotTakenError, type BookingDb } from "./db";
import { notifyInBackground, type NotifyFn } from "./notify";
import { bookingRequestSchema, type BookingRequest } from "./schemas";
import { nearestSlots, type Slot } from "./slots";
import { getTokenSecret, manageTokenExpiry, signManageToken } from "./tokens";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CreateBookingFailure =
  | { ok: false; reason: "validation"; errors: Record<string, string[]> }
  | { ok: false; reason: "not_connected" }
  | { ok: false; reason: "unknown_service" }
  | { ok: false; reason: "mode_unavailable" }
  | { ok: false; reason: "encryption_unavailable" }
  | { ok: false; reason: "slot_unavailable"; alternatives: Slot[] }
  | { ok: false; reason: "slot_taken"; alternatives: Slot[] };

export type CreateBookingResult =
  | { ok: true; relations: BookingWithRelations; booking: Booking; client: Client }
  | CreateBookingFailure;

export interface BookingDeps {
  db?: BookingDb | null;
  now?: Date;
  settings?: SiteSettings;
  service?: Service | null;
  notify?: NotifyFn;
  tokenSecret?: string;
  keyring?: Keyring | null;
  paymentProvider?: PaymentProvider;
  paymentsEnabled?: boolean;
}

export function fieldErrorsOf(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Free slots around `at` (±1 day) for the "just taken" recovery and the server-side re-check. */
export async function slotsAround(
  db: BookingDb,
  service: Service,
  settings: SiteSettings,
  at: Date,
  now: Date,
): Promise<Slot[]> {
  const from = new Date(at.getTime() - DAY_MS);
  const to = new Date(at.getTime() + DAY_MS);
  const context = await loadAvailabilityContext(db, { from, to });
  return slotsForRange({ service, settings, context, from, to, now });
}

export function modeAllowed(service: Service, settings: SiteSettings, mode: Booking["mode"]) {
  if (!service.deliveryModes.includes(mode)) return false;
  if (mode === "in_person" && !settings.inPersonAvailable) return false;
  return true;
}

export async function createBooking(
  input: unknown,
  deps: BookingDeps = {},
): Promise<CreateBookingResult> {
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, reason: "validation", errors: fieldErrorsOf(parsed.error) };
  const data: BookingRequest = parsed.data;

  const db = deps.db !== undefined ? deps.db : getDb();
  if (!db) return { ok: false, reason: "not_connected" };
  const now = deps.now ?? new Date();
  const service =
    deps.service !== undefined ? deps.service : await getServiceBySlug(data.serviceSlug);
  if (!service || service.slug !== data.serviceSlug)
    return { ok: false, reason: "unknown_service" };
  const settings = deps.settings ?? (await getSiteSettings());
  if (!modeAllowed(service, settings, data.mode)) return { ok: false, reason: "mode_unavailable" };

  const startsAt = new Date(data.startsAt);
  const slots = await slotsAround(db, service, settings, startsAt, now);
  if (!slots.some((s) => s.startsAt === data.startsAt)) {
    return { ok: false, reason: "slot_unavailable", alternatives: nearestSlots(slots, startsAt) };
  }
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  let encrypted: { ciphertext: Uint8Array; keyId: string } | null = null;
  if (data.birthDetails) {
    const ring = deps.keyring !== undefined ? deps.keyring : loadKeyring();
    if (!ring) return { ok: false, reason: "encryption_unavailable" };
    encrypted = encryptBirthDetails(data.birthDetails, ring);
  }

  const secret = deps.tokenSecret ?? getTokenSecret();
  const bookingId = randomUUID();
  const manageToken = signManageToken(bookingId, manageTokenExpiry(now), secret);
  const paymentsEnabled = deps.paymentsEnabled ?? isPaymentsEnabled();
  const priced = service.priceMinor !== null && service.priceMinor > 0 && service.currency;
  const provider = deps.paymentProvider ?? getPaymentProvider();

  let written: { booking: Booking; client: Client };
  try {
    written = await db.transaction(async (tx) => {
      const [client] = await tx
        .insert(clients)
        .values({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          timezone: data.clientTimezone,
          preferredLanguage: data.preferredLanguage,
          birthDetailsEncrypted: encrypted?.ciphertext ?? null,
          birthDetailsKeyId: encrypted?.keyId ?? null,
          marketingConsent: data.marketingConsent,
        })
        .onConflictDoUpdate({
          target: clients.email,
          set: {
            fullName: data.fullName,
            phone: sql`coalesce(excluded.phone, ${clients.phone})`,
            timezone: data.clientTimezone,
            preferredLanguage: sql`coalesce(excluded.preferred_language, ${clients.preferredLanguage})`,
            birthDetailsEncrypted: sql`coalesce(excluded.birth_details_encrypted, ${clients.birthDetailsEncrypted})`,
            birthDetailsKeyId: sql`coalesce(excluded.birth_details_key_id, ${clients.birthDetailsKeyId})`,
            marketingConsent: sql`(${clients.marketingConsent} or excluded.marketing_consent)`,
          },
        })
        .returning();
      if (!client) throw new Error("client upsert returned nothing");

      let status = initialBookingStatus({ priceMinor: service.priceMinor, paymentsEnabled });
      let intent: Awaited<ReturnType<PaymentProvider["createIntent"]>> | null = null;
      if (priced) {
        intent = await provider.createIntent({
          bookingId,
          amountMinor: service.priceMinor ?? 0,
          currency: service.currency ?? settings.defaultCurrency,
          idempotencyKey: `booking:${bookingId}`,
          description: `${service.name} — ${settings.brandName}`,
          customerEmail: data.email,
        });
        status = initialBookingStatus({
          priceMinor: service.priceMinor,
          paymentsEnabled,
          intentStatus: intent.bookingStatus,
        });
      }

      const [booking] = await tx
        .insert(bookings)
        .values({
          id: bookingId,
          clientId: client.id,
          serviceId: service.id,
          locationId: null,
          startsAt,
          endsAt,
          clientTimezone: data.clientTimezone,
          mode: data.mode,
          status,
          clientNotes: buildNotes(data),
          manageToken,
        })
        .returning();
      if (!booking) throw new Error("booking insert returned nothing");

      await tx.insert(bookingStatusHistory).values({
        bookingId,
        fromStatus: null,
        toStatus: status,
        changedBy: "client",
        reason: "Booked online",
      });

      if (priced && intent) {
        await tx.insert(payments).values({
          bookingId,
          provider: intent.provider,
          providerRef: intent.providerRef,
          amountMinor: service.priceMinor ?? 0,
          currency: service.currency ?? settings.defaultCurrency,
          status: intent.status,
          idempotencyKey: `booking:${bookingId}`,
        });
      }

      if (data.property?.floorPlanPath) {
        await tx
          .update(floorPlans)
          .set({ bookingId })
          .where(
            and(
              eq(floorPlans.storagePath, data.property.floorPlanPath),
              isNull(floorPlans.bookingId),
            ),
          );
      }
      return { booking, client };
    });
  } catch (error) {
    if (isSlotTakenError(error)) {
      const fresh = await slotsAround(db, service, settings, startsAt, now);
      return {
        ok: false,
        reason: "slot_taken",
        alternatives: nearestSlots(
          fresh.filter((s) => s.startsAt !== data.startsAt),
          startsAt,
        ),
      };
    }
    throw error;
  }

  const relations: BookingWithRelations = {
    booking: written.booking,
    client: written.client,
    service,
    settings,
  };
  track("booking_completed", {
    serviceSlug: service.slug,
    currency: service.currency ?? undefined,
    amountMinor: service.priceMinor ?? undefined,
  });
  notifyInBackground(deps.notify, "confirmation", relations);
  return { ok: true, relations, booking: written.booking, client: written.client };
}

/** The client's question plus the non-sensitive intake facts, as one note for the admin. */
function buildNotes(data: BookingRequest): string | null {
  const lines: string[] = [];
  if (data.question) lines.push(data.question);
  if (data.property?.type) lines.push(`Property: ${data.property.type}`);
  if (data.property?.compassReading) lines.push(`Compass: ${data.property.compassReading}`);
  if (data.property?.floorPlanPath) lines.push("Floor plan: uploaded");
  if (data.gender) lines.push(`Self-described gender: ${data.gender}`);
  if (data.locationPath) lines.push(`Booked from: ${data.locationPath}`);
  return lines.length > 0 ? lines.join("\n") : null;
}
