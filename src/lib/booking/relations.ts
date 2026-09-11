/**
 * Loads the `BookingWithRelations` bundle the notification layer and the manage page render
 * from. Birth details stay as ciphertext on the client row; nothing here decrypts.
 */
import { eq } from "drizzle-orm";
import { bookings, clients, services, siteSettings, type SiteSettings } from "@/db/schema";
import { SEED_NS, SITE_SETTINGS_KEY, hydrate, siteSettingsSeed } from "@/content/seed";
import type { BookingWithRelations } from "@/lib/notifications/types";
import type { BookingDb } from "./db";

export async function loadSettings(db: BookingDb): Promise<SiteSettings> {
  const row = await db.query.siteSettings.findFirst();
  return row ?? hydrate<SiteSettings>(SEED_NS.siteSettings, SITE_SETTINGS_KEY, siteSettingsSeed);
}

export async function loadRelations(
  db: BookingDb,
  bookingId: string,
  settings?: SiteSettings,
): Promise<BookingWithRelations | null> {
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) return null;
  const [client, service, resolvedSettings] = await Promise.all([
    db.query.clients.findFirst({ where: eq(clients.id, booking.clientId) }),
    db.query.services.findFirst({ where: eq(services.id, booking.serviceId) }),
    settings ? Promise.resolve(settings) : loadSettings(db),
  ]);
  if (!client || !service) return null;
  return { booking, client, service, settings: resolvedSettings };
}

/** The unused `siteSettings` import keeps the relational query key typed. */
export const _settingsTable = siteSettings;
