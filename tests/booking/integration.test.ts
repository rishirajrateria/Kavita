/**
 * End-to-end against PGlite with the real migrations: create, the double-booking race on the
 * partial unique index, reschedule (notice period), cancel, token lookup, availability.
 */
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb, seedTestContent, type TestDb } from "../helpers/pglite-db";
import { SEED_NS, SITE_SETTINGS_KEY, hydrate, siteSettingsSeed } from "@/content/seed";
import {
  bookingStatusHistory,
  bookings,
  clients,
  payments,
  services,
  type SiteSettings,
} from "@/db/schema";
import { getAvailability } from "@/lib/booking/availability";
import { createBooking, type BookingDeps } from "@/lib/booking/create";
import { cancelBooking, getBookingByToken, rescheduleBooking } from "@/lib/booking/manage";
import { verifyManageToken } from "@/lib/booking/tokens";
import { decryptBirthDetails, loadKeyring } from "@/lib/crypto/birth-details";
import { NoopPaymentProvider } from "@/lib/payments";
import type { BookingWithRelations, NotificationKind } from "@/lib/notifications/types";

const NOW = new Date("2026-10-01T00:00:00Z");
const SLOT = "2026-10-05T04:30:00.000Z"; // Monday 10:00 IST
const SECRET = "integration-secret-16-chars";

function request(overrides: Record<string, unknown> = {}) {
  return {
    serviceSlug: "kundli-analysis",
    mode: "online_video",
    startsAt: SLOT,
    clientTimezone: "America/New_York",
    fullName: "Asha Example",
    email: "asha@example.com",
    dialCode: "+1",
    phone: "2125550100",
    birthDate: "1990-04-12",
    birthTime: "23:10",
    birthPlace: "Jaipur",
    question: "Career timing",
    ...overrides,
  };
}

export async function run() {
  const { db, close } = await createTestDb();
  try {
    await seedTestContent(db);
    const settings = hydrate<SiteSettings>(
      SEED_NS.siteSettings,
      SITE_SETTINGS_KEY,
      siteSettingsSeed,
    );
    const service = (await db.query.services.findFirst({
      where: eq(services.slug, "kundli-analysis"),
    }))!;
    const keyring = loadKeyring({ DATA_ENCRYPTION_KEY: randomBytes(32).toString("base64") });
    const sent: NotificationKind[] = [];
    const notify = async (kind: NotificationKind, _b: BookingWithRelations) => {
      sent.push(kind);
    };
    const deps: BookingDeps = {
      db,
      now: NOW,
      settings,
      service,
      tokenSecret: SECRET,
      keyring,
      notify,
      paymentsEnabled: false,
      paymentProvider: new NoopPaymentProvider(),
    };

    // --- availability from the seeded rules ---------------------------------------------------
    const avail = await getAvailability({
      serviceSlug: "kundli-analysis",
      monthISO: "2026-10",
      clientTz: "America/New_York",
      now: NOW,
      db,
      settings,
      service,
    });
    check(avail !== null && avail.days.length > 0, "integration: availability has days");
    check(
      avail!.days.some((d) => d.slots.some((s) => s.startsAt === SLOT)),
      "integration: the test slot is offered",
    );
    check(
      !avail!.placeholderRules,
      "integration: DB rules are used, not the seed placeholder flag",
    );
    check(
      avail!.days.every((d) => d.date.startsWith("2026-10") || d.date.startsWith("2026-09-30")),
      "integration: days are client-local within the month (a 30 Sept evening slot may appear for NY)",
    );

    // --- create ------------------------------------------------------------------------------
    const created = await createBooking(request(), deps);
    check(created.ok, `integration: booking created (${created.ok ? "ok" : created.reason})`);
    if (!created.ok) return;
    equal(created.booking.status, "pending", "integration: unpriced service → pending");
    equal(created.booking.startsAt.toISOString(), SLOT, "integration: stored start is UTC");
    equal(
      created.booking.endsAt.toISOString(),
      "2026-10-05T05:30:00.000Z",
      "integration: end = start + 60 min",
    );
    equal(created.booking.clientTimezone, "America/New_York", "integration: client zone stored");
    const verified = verifyManageToken(created.booking.manageToken, { now: NOW, secret: SECRET });
    check(
      verified.ok && verified.bookingId === created.booking.id,
      "integration: manage token verifies to the booking",
    );
    const client = (await db.query.clients.findFirst({
      where: eq(clients.email, "asha@example.com"),
    }))!;
    check(
      client.birthDetailsEncrypted !== null && client.birthDetailsKeyId === "k1",
      "integration: birth details encrypted with key id",
    );
    const plain = decryptBirthDetails(
      client.birthDetailsEncrypted!,
      client.birthDetailsKeyId!,
      keyring!,
    );
    equal(plain.place, "Jaipur", "integration: birth details decrypt");
    check(
      !Buffer.from(client.birthDetailsEncrypted!).toString("latin1").includes("Jaipur"),
      "integration: plaintext not on the row",
    );
    const history = await db
      .select()
      .from(bookingStatusHistory)
      .where(eq(bookingStatusHistory.bookingId, created.booking.id));
    check(
      history.length === 1 &&
        history[0]!.toStatus === "pending" &&
        history[0]!.changedBy === "client",
      "integration: history row written by client",
    );
    equal(sent.join(","), "confirmation", "integration: confirmation notification requested");
    check(
      (await db.select().from(payments)).length === 0,
      "integration: no payment row for an on-request service",
    );

    const after = await getAvailability({
      serviceSlug: "kundli-analysis",
      monthISO: "2026-10",
      clientTz: "Asia/Kolkata",
      now: NOW,
      db,
      settings,
      service,
    });
    check(
      !after!.days.some((d) => d.slots.some((s) => s.startsAt === SLOT)),
      "integration: booked slot disappears",
    );
    check(
      !after!.days.some((d) => d.slots.some((s) => s.startsAt === "2026-10-05T05:30:00.000Z")),
      "integration: 15-min buffer after removes the adjacent 11:00 start",
    );

    // Re-booking the same slot by the engine path (availability check) → slot_unavailable.
    const dup = await createBooking(request({ email: "someone@example.com" }), deps);
    check(
      !dup.ok && dup.reason === "slot_unavailable" && dup.alternatives.length === 3,
      "integration: taken slot is refused before insert with 3 alternatives",
    );

    // --- double-booking race: two inserts race past the availability check ----------------
    const raceSlot = new Date("2026-10-06T04:30:00.000Z");
    const rawInsert = (email: string) =>
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(clients)
          .values({ fullName: "Race", email, timezone: "Asia/Kolkata" })
          .returning();
        // Simulate the moment after the availability check: both believe the slot is free.
        await tx.execute(sql`select pg_sleep(0.01)`);
        return tx
          .insert(bookings)
          .values({
            clientId: c!.id,
            serviceId: service.id,
            startsAt: raceSlot,
            endsAt: new Date(raceSlot.getTime() + 3_600_000),
            clientTimezone: "Asia/Kolkata",
            mode: "online_video",
            status: "pending",
            manageToken: `race-${email}`,
          })
          .returning();
      });
    const results = await Promise.allSettled([
      rawInsert("race1@example.com"),
      rawInsert("race2@example.com"),
    ]);
    const wins = results.filter((r) => r.status === "fulfilled").length;
    const losses = results.filter((r) => r.status === "rejected");
    equal(wins, 1, "race: exactly one of two concurrent inserts succeeds");
    equal(losses.length, 1, "race: the other is rejected");
    const err = losses[0]?.status === "rejected" ? losses[0].reason : null;
    check(
      String(
        (err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code,
      ) === "23505",
      "race: rejection is unique_violation 23505",
    );
    const held = await db.select().from(bookings).where(eq(bookings.startsAt, raceSlot));
    equal(held.length, 1, "race: one row holds the slot");

    // The engine path maps the same race onto slot_taken with alternatives.
    const racedSlot = "2026-10-07T04:30:00.000Z";
    const engineRace = await Promise.all([
      createBooking(request({ email: "e1@example.com", startsAt: racedSlot }), deps),
      createBooking(request({ email: "e2@example.com", startsAt: racedSlot }), deps),
    ]);
    const okCount = engineRace.filter((r) => r.ok).length;
    const taken = engineRace.find((r) => !r.ok);
    equal(okCount, 1, "engine race: one createBooking wins");
    check(
      taken !== undefined &&
        !taken.ok &&
        (taken.reason === "slot_taken" || taken.reason === "slot_unavailable"),
      `engine race: loser gets slot_taken/slot_unavailable (${taken && !taken.ok ? taken.reason : "?"})`,
    );
    check(
      taken !== undefined &&
        !taken.ok &&
        "alternatives" in taken &&
        !taken.alternatives.some((s) => s.startsAt === racedSlot),
      "engine race: alternatives exclude the contested slot",
    );

    // --- manage: lookup, reschedule window, cancel ------------------------------------------
    const token = created.booking.manageToken;
    const found = await getBookingByToken(token, deps);
    check(
      found.ok && found.relations.booking.id === created.booking.id && found.canReschedule,
      "manage: token lookup",
    );
    check(!(await getBookingByToken("v1.bad.token", deps)).ok, "manage: bad token");
    const expired = await getBookingByToken(token, {
      ...deps,
      now: new Date("2026-12-01T00:00:00Z"),
    });
    check(!expired.ok && expired.reason === "expired", "manage: expired token");

    const tooLate = await rescheduleBooking(
      token,
      { startsAt: "2026-10-08T04:30:00.000Z" },
      { ...deps, now: new Date("2026-10-04T05:00:00Z") },
    );
    check(
      !tooLate.ok && tooLate.reason === "notice_period" && tooLate.noticeHours === 24,
      "reschedule: inside 24h notice is refused",
    );
    const justInTime = await getBookingByToken(token, {
      ...deps,
      now: new Date("2026-10-04T04:29:00Z"),
    });
    check(justInTime.ok && justInTime.canReschedule, "reschedule: 24h01m before is still allowed");
    const badSlot = await rescheduleBooking(token, { startsAt: "2026-10-04T04:30:00.000Z" }, deps); // Sunday
    check(!badSlot.ok && badSlot.reason === "slot_unavailable", "reschedule: closed day refused");
    const moved = await rescheduleBooking(
      token,
      { startsAt: "2026-10-08T04:30:00.000Z", clientTimezone: "Europe/London" },
      deps,
    );
    check(moved.ok, `reschedule: moved (${moved.ok ? "ok" : moved.reason})`);
    if (moved.ok) {
      equal(
        moved.relations.booking.rescheduledFromId,
        created.booking.id,
        "reschedule: new row links to the old",
      );
      equal(moved.relations.booking.clientTimezone, "Europe/London", "reschedule: zone updated");
      check(
        moved.relations.previous?.startsAt.toISOString() === SLOT,
        "reschedule: previous slot carried for the email",
      );
      const old = await db.query.bookings.findFirst({ where: eq(bookings.id, created.booking.id) });
      equal(old?.status, "rescheduled", "reschedule: old booking marked rescheduled");
      const oldLink = await getBookingByToken(token, deps);
      check(
        oldLink.ok && !oldLink.isActive && !oldLink.canReschedule && !oldLink.canCancel,
        "reschedule: old link resolves but is inactive",
      );
      check(sent.at(-1) === "reschedule", "reschedule: notification requested");
      const freed = await getAvailability({
        serviceSlug: "kundli-analysis",
        monthISO: "2026-10",
        clientTz: "Asia/Kolkata",
        now: NOW,
        db,
        settings,
        service,
      });
      check(
        freed!.days.some((d) => d.slots.some((s) => s.startsAt === SLOT)),
        "reschedule: original slot is free again",
      );

      const newToken = moved.relations.booking.manageToken;
      const cancelled = await cancelBooking(newToken, { reason: "Travelling" }, deps);
      check(
        cancelled.ok &&
          cancelled.relations.booking.status === "cancelled" &&
          cancelled.relations.cancellationReason === "Travelling",
        "cancel: status + reason",
      );
      const twice = await cancelBooking(newToken, {}, deps);
      check(!twice.ok && twice.reason === "not_active", "cancel: cannot cancel twice");
      const hist = await db
        .select()
        .from(bookingStatusHistory)
        .where(eq(bookingStatusHistory.bookingId, moved.relations.booking.id));
      equal(
        hist.map((h) => h.toStatus).join(","),
        "pending,cancelled",
        "cancel: history chain for the new booking",
      );
      check(sent.at(-1) === "cancellation", "cancel: notification requested");
    }

    // --- mode gate and priced service -------------------------------------------------------
    const inPerson = await createBooking(
      request({ email: "ip@example.com", mode: "in_person", startsAt: "2026-10-09T04:30:00.000Z" }),
      deps,
    );
    check(
      !inPerson.ok && inPerson.reason === "mode_unavailable",
      "create: in-person refused while inPersonAvailable is false",
    );
    const noKey = await createBooking(
      request({ email: "nk@example.com", startsAt: "2026-10-09T04:30:00.000Z" }),
      { ...deps, keyring: null },
    );
    check(
      !noKey.ok && noKey.reason === "encryption_unavailable",
      "create: birth details without a key are refused, never stored plain",
    );
    await db
      .update(services)
      .set({ priceMinor: 500000, currency: "INR" })
      .where(eq(services.id, service.id));
    const pricedService = (await db.query.services.findFirst({
      where: eq(services.id, service.id),
    }))!;
    const priced = await createBooking(
      request({ email: "paid@example.com", startsAt: "2026-10-09T04:30:00.000Z" }),
      { ...deps, service: pricedService },
    );
    check(
      priced.ok && priced.booking.status === "payment_pending_offline",
      "create: priced service → payment_pending_offline via noop",
    );
    const pay = await db.select().from(payments);
    check(
      pay.length === 1 &&
        pay[0]!.provider === "noop" &&
        pay[0]!.amountMinor === 500000 &&
        pay[0]!.idempotencyKey === `booking:${priced.ok ? priced.booking.id : ""}`,
      "create: payment row recorded",
    );
    const invalid = await createBooking({ serviceSlug: "kundli-analysis" }, deps);
    check(
      !invalid.ok &&
        invalid.reason === "validation" &&
        "errors" in invalid &&
        "fullName" in invalid.errors,
      "create: validation errors keyed by field",
    );
    const noDb = await createBooking(request(), { ...deps, db: null });
    check(!noDb.ok && noDb.reason === "not_connected", "create: no database → not_connected");
  } finally {
    await close();
  }
}

export type { TestDb };
