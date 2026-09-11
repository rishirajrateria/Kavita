/**
 * A complete `BookingWithRelations` built from the seed content plus an obviously fictional
 * client. Nothing here is real client data.
 */
import type { Booking, Client, Service, SiteSettings } from "@/db/schema";
import {
  SEED_NS,
  SITE_SETTINGS_KEY,
  hydrate,
  servicesSeed,
  siteSettingsSeed,
} from "@/content/seed";
import type { BookingWithRelations } from "@/lib/notifications/types";

export const FIXTURE_NOW = new Date("2026-10-20T12:00:00Z");

export function fixtureService(slug = "integrated-life-reading"): Service {
  const seed = servicesSeed.find((s) => s.slug === slug) ?? servicesSeed[0];
  if (!seed) throw new Error("no seeded services");
  return hydrate<Service>(SEED_NS.services, seed.slug, seed);
}

export function fixtureSettings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    ...hydrate<SiteSettings>(SEED_NS.siteSettings, SITE_SETTINGS_KEY, siteSettingsSeed),
    ...overrides,
  };
}

export function fixtureClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "6f1d2c3b-1111-4aaa-8bbb-000000000001",
    fullName: "Test Client",
    email: "test.client@example.com",
    phone: "+1 555 010 0000",
    timezone: "America/New_York",
    preferredLanguage: "en",
    birthDetailsEncrypted: Buffer.from("ciphertext-not-plaintext"),
    birthDetailsKeyId: "v1",
    marketingConsent: false,
    createdAt: FIXTURE_NOW,
    updatedAt: FIXTURE_NOW,
    ...overrides,
  };
}

export function fixtureBooking(overrides: Partial<Booking> = {}): Booking {
  const startsAt = new Date("2026-10-21T14:00:00Z"); // 10:00 New York (EDT), 19:30 Kolkata
  return {
    id: "9a8b7c6d-2222-4ccc-8ddd-000000000002",
    clientId: "6f1d2c3b-1111-4aaa-8bbb-000000000001",
    serviceId: fixtureService().id,
    locationId: null,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 90 * 60_000),
    clientTimezone: "America/New_York",
    mode: "online_video",
    status: "payment_pending_offline",
    clientNotes: "Should we buy the flat in Jersey City this year or wait?",
    manageToken: "tok_fixture_abc123",
    rescheduledFromId: null,
    createdAt: FIXTURE_NOW,
    updatedAt: FIXTURE_NOW,
    ...overrides,
  };
}

export function fixture(overrides: Partial<BookingWithRelations> = {}): BookingWithRelations {
  return {
    booking: fixtureBooking(),
    client: fixtureClient(),
    service: fixtureService(),
    settings: fixtureSettings(),
    ...overrides,
  };
}
