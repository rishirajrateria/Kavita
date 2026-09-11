/**
 * Against PGlite with the real migrations: the Phase 5 tables (booking_notes, feature_flags,
 * notification_templates), the admin booking actions, role-gated birth details and the
 * template override read that `notify()` performs.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb, seedTestContent } from "../helpers/pglite-db";
import { SEED_NS, SITE_SETTINGS_KEY, hydrate, siteSettingsSeed } from "@/content/seed";
import {
  adminUsers,
  bookingStatusHistory,
  services,
  socialLinks,
  type SiteSettings,
} from "@/db/schema";
import {
  addBookingNote,
  applyBookingAction,
  getBookingDetail,
  listBookings,
} from "@/lib/admin/bookings";
import { bookingListQuerySchema } from "@/lib/admin/manage-schemas";
import {
  getTemplateOverride,
  listFlags,
  replaceWeeklyRules,
  setFlag,
  upsertTemplate,
  wouldRemoveLastOwner,
} from "@/lib/admin/settings";
import {
  createSocialLink,
  listAllSocialLinks,
  previewFor,
  reorderSocialLinks,
  updateSocialLink,
} from "@/lib/admin/social";
import { createBooking, type BookingDeps } from "@/lib/booking/create";
import { loadKeyring } from "@/lib/crypto/birth-details";
import { NoopPaymentProvider } from "@/lib/payments";
import type { BookingWithRelations, NotificationKind } from "@/lib/notifications/types";

const NOW = new Date("2026-10-01T00:00:00Z");
const SLOT = "2026-10-05T04:30:00.000Z"; // Monday 10:00 IST
const NEXT_SLOT = "2026-10-06T04:30:00.000Z"; // Tuesday 10:00 IST

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
    const keyKey = randomBytes(32).toString("base64");
    const keyring = loadKeyring({ DATA_ENCRYPTION_KEY: keyKey });
    process.env.DATA_ENCRYPTION_KEY = keyKey;
    const sent: NotificationKind[] = [];
    const notify = async (kind: NotificationKind, _b: BookingWithRelations) => {
      sent.push(kind);
    };
    const deps: BookingDeps = {
      db,
      now: NOW,
      settings,
      service,
      tokenSecret: "integration-secret-16-chars",
      keyring,
      notify,
      paymentsEnabled: false,
      paymentProvider: new NoopPaymentProvider(),
    };
    process.env.BOOKING_TOKEN_SECRET ??= "integration-secret-16-chars";
    const [admin] = await db
      .insert(adminUsers)
      .values({
        authUserId: "00000000-0000-4000-8000-000000000001",
        email: "owner@example.com",
        displayName: "Owner",
        role: "owner",
      })
      .returning();
    const created = await createBooking(
      {
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
      },
      deps,
    );
    check(created.ok, "setup: booking created");
    if (!created.ok) return;
    const id = created.booking.id;

    // --- list + filters --------------------------------------------------------------------
    const all = await listBookings(db, bookingListQuerySchema.parse({}), settings);
    equal(all.total, 1, "list: one booking");
    equal(all.rows[0]?.clientName, "Asha Example", "list: joined client name");
    const none = await listBookings(
      db,
      bookingListQuerySchema.parse({ status: "cancelled" }),
      settings,
    );
    equal(none.total, 0, "list: status filter");
    const byDay = await listBookings(
      db,
      bookingListQuerySchema.parse({ from: "2026-10-05", to: "2026-10-05" }),
      settings,
    );
    equal(byDay.total, 1, "list: date filter in practitioner zone");
    const search = await listBookings(db, bookingListQuerySchema.parse({ q: "asha@" }), settings);
    equal(search.total, 1, "list: search by email");

    // --- detail: birth details by role --------------------------------------------------------
    const noSign = async () => null;
    const asOwner = await getBookingDetail(db, id, "owner", { settings, signUrl: noSign });
    check(asOwner?.birthDetails.state === "shown", "detail: owner sees birth details");
    if (asOwner?.birthDetails.state === "shown")
      equal(asOwner.birthDetails.details.place, "Jaipur", "detail: decrypted place");
    check(
      !("birthDetailsEncrypted" in (asOwner?.client ?? {})),
      "detail: ciphertext stripped from client view",
    );
    const asViewer = await getBookingDetail(db, id, "viewer", { settings, signUrl: noSign });
    equal(asViewer?.birthDetails.state, "restricted", "detail: viewer restricted");
    equal(asOwner?.history.length, 1, "detail: history from creation");

    // --- notes ------------------------------------------------------------------------------
    const note = await addBookingNote(db, id, admin!.id, "Called to confirm; prefers Hindi.");
    equal(note.bookingId, id, "notes: stored");
    equal(
      (await getBookingDetail(db, id, "editor", { settings, signUrl: noSign }))?.notes.length,
      1,
      "notes: listed on detail",
    );

    // --- actions ----------------------------------------------------------------------------
    const confirm = await applyBookingAction(
      db,
      id,
      { action: "confirm" },
      { adminUserId: admin!.id, settings, notify },
    );
    check(confirm.ok && confirm.after.status === "confirmed", "action: confirm");
    const again = await applyBookingAction(
      db,
      id,
      { action: "confirm" },
      { adminUserId: admin!.id, settings, notify },
    );
    check(!again.ok && again.reason === "invalid_transition", "action: confirm twice rejected");

    const move = await applyBookingAction(
      db,
      id,
      { action: "reschedule", startsAt: new Date(NEXT_SLOT), notifyClient: true },
      {
        adminUserId: admin!.id,
        settings,
        notify,
        now: NOW,
        tokenSecret: "integration-secret-16-chars",
      },
    );
    check(move.ok, `action: reschedule${move.ok ? "" : ` (${move.reason})`}`);
    if (!move.ok) return;
    equal(move.before.status, "confirmed", "reschedule: old booking snapshot");
    equal(move.after.startsAt.toISOString(), NEXT_SLOT, "reschedule: new start");
    equal(move.after.rescheduledFromId, id, "reschedule: link to old");
    const oldRow = await db.query.bookings.findFirst({ where: (b, { eq: e }) => e(b.id, id) });
    equal(oldRow?.status, "rescheduled", "reschedule: old marked rescheduled");
    const newId = move.after.id;
    equal(
      (await getBookingDetail(db, newId, "owner", { settings, signUrl: noSign }))?.notes.length,
      1,
      "reschedule: notes follow the booking",
    );
    const hist = await db
      .select()
      .from(bookingStatusHistory)
      .where(eq(bookingStatusHistory.bookingId, newId));
    equal(hist[0]?.changedBy, "admin", "reschedule: history actor admin");
    equal(hist[0]?.adminUserId, admin!.id, "reschedule: history admin id");
    await new Promise((r) => setTimeout(r, 5));
    check(sent.includes("reschedule"), "reschedule: client notified");

    const taken = await applyBookingAction(
      db,
      newId,
      { action: "reschedule", startsAt: new Date("2026-10-05T03:00:00.000Z"), notifyClient: false },
      { adminUserId: admin!.id, settings, notify, now: NOW },
    );
    check(
      !taken.ok && taken.reason === "slot_unavailable",
      "reschedule: outside hours refused with alternatives",
    );
    if (!taken.ok && taken.reason === "slot_unavailable")
      check(taken.alternatives.length > 0, "reschedule: alternatives offered");

    const cancel = await applyBookingAction(
      db,
      newId,
      { action: "cancel", reason: "Client asked to postpone", notifyClient: true },
      { adminUserId: admin!.id, settings, notify },
    );
    check(cancel.ok && cancel.after.status === "cancelled", "action: cancel");
    await new Promise((r) => setTimeout(r, 5));
    check(sent.includes("cancellation"), "cancel: client notified");
    const complete = await applyBookingAction(
      db,
      newId,
      { action: "complete" },
      { adminUserId: admin!.id, settings, notify },
    );
    check(!complete.ok, "action: cannot complete a cancelled booking");

    // --- flags ----------------------------------------------------------------------------
    delete process.env.PAYMENTS_ENABLED;
    const before = await listFlags(db);
    equal(
      before.find((f) => f.key === "PAYMENTS_ENABLED")?.source,
      "default",
      "flags: default before write",
    );
    const set = await setFlag(
      db,
      { key: "PAYMENTS_ENABLED", value: true, description: null },
      admin!.id,
    );
    equal(set.before, null, "flags: before null on first write");
    equal(set.after.value, true, "flags: stored true");
    const set2 = await setFlag(
      db,
      { key: "PAYMENTS_ENABLED", value: false, description: "off" },
      admin!.id,
    );
    equal(set2.before?.value, true, "flags: before captured on update");
    equal(
      (await listFlags(db)).find((f) => f.key === "PAYMENTS_ENABLED")?.value,
      false,
      "flags: updated",
    );

    // --- templates --------------------------------------------------------------------------
    equal(await getTemplateOverride("confirmation", "client", db), null, "templates: none yet");
    await upsertTemplate(
      db,
      {
        kind: "confirmation",
        recipient: "client",
        subject: "Booked: {{serviceName}}",
        intro: null,
        isEnabled: true,
      },
      admin!.id,
    );
    equal(
      (await getTemplateOverride("confirmation", "client", db))?.subject,
      "Booked: {{serviceName}}",
      "templates: read back",
    );
    const up = await upsertTemplate(
      db,
      { kind: "confirmation", recipient: "client", subject: "X", intro: "Hi", isEnabled: false },
      admin!.id,
    );
    equal(up.before?.subject, "Booked: {{serviceName}}", "templates: before on update");
    equal(
      await getTemplateOverride("confirmation", "client", db),
      null,
      "templates: disabled row ignored",
    );
    equal(
      await getTemplateOverride("confirmation", "practitioner", db),
      null,
      "templates: recipient scoped",
    );

    // --- availability -------------------------------------------------------------------------
    const replaced = await replaceWeeklyRules(db, [
      { weekday: 1, startTime: "10:00", endTime: "13:00", serviceId: null, isActive: true },
      { weekday: 3, startTime: "15:00", endTime: "18:00", serviceId: null, isActive: true },
    ]);
    check(replaced.before.length > 0, "availability: seed rules were there");
    equal(replaced.after.length, 2, "availability: grid replaced");

    // --- admin users ------------------------------------------------------------------------
    check(
      await wouldRemoveLastOwner(db, admin!.id, { role: "editor" }),
      "users: last owner protected",
    );
    check(
      !(await wouldRemoveLastOwner(db, admin!.id, { displayName: "K" })),
      "users: rename allowed",
    );

    // --- social links -----------------------------------------------------------------------
    const a = await createSocialLink(db, {
      platform: "instagram",
      url: "https://instagram.com/kavita",
      label: "Instagram",
      icon: "instagram",
      sortOrder: 0,
      isVisible: true,
      showInFooter: true,
      showInHeader: false,
      includeInSameas: true,
    });
    const b = await createSocialLink(db, {
      platform: "whatsapp",
      url: "https://wa.me/919876543210",
      label: "WhatsApp",
      icon: "whatsapp",
      sortOrder: 0,
      isVisible: true,
      showInFooter: true,
      showInHeader: true,
      includeInSameas: false,
    });
    check(a.ok && b.ok, "social: created");
    if (!a.ok || !b.ok) return;
    equal(b.link.sortOrder, a.link.sortOrder + 10, "social: appended at the end");
    const dup = await createSocialLink(db, { ...a.link, sortOrder: 0 });
    check(!dup.ok && dup.reason === "duplicate_url", "social: duplicate url refused");
    await reorderSocialLinks(db, [b.link.id, a.link.id]);
    const ordered = await listAllSocialLinks(db);
    equal(ordered[0]?.id, b.link.id, "social: reorder persisted");
    const upd = await updateSocialLink(db, a.link.id, { isVisible: false });
    check(
      upd.ok && upd.before.isVisible && !upd.after.isVisible,
      "social: update with before/after",
    );
    const preview = previewFor(await listAllSocialLinks(db));
    equal(preview.footer.length, 1, "social: hidden link leaves the footer preview");
    equal(preview.sameAs.length, 0, "social: contact channel and hidden link excluded from sameAs");
    equal((await db.select().from(socialLinks)).length, 2, "social: two rows");
  } finally {
    await close();
  }
}
