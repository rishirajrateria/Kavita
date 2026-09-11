/**
 * The single `site_settings` row. Every `{{PLACEHOLDER}}` is unfilled client data listed in
 * NEEDS-REAL-DATA.md. Nothing here is invented.
 */
import type { SiteSettings } from "@/db/schema";
import type { SeedRow } from "./_shared";

export const SITE_SETTINGS_KEY = "default";

/**
 * ASSUMPTION (flagged): `Asia/Kolkata` is assumed because the primary market is India and the
 * brief's in-person city is `{{CITY}}`. Replace with the practitioner's real IANA timezone.
 */
export const ASSUMED_PRACTITIONER_TIMEZONE = "Asia/Kolkata";

export const siteSettingsSeed: SeedRow<SiteSettings> = {
  brandName: "Astrologer Kavita",
  legalEntity: "{{LEGAL_ENTITY}}",
  practitionerName: "{{FULL_NAME}}",
  tagline: "Vedic astrology and vastu, read together as one integrated consultation.",
  phone: "{{PHONE with country code}}",
  whatsapp: "{{WHATSAPP}}",
  email: "{{EMAIL}}",
  addressLine1: null,
  addressLine2: null,
  addressPostalCode: null,
  addressRegion: null,
  city: "{{CITY}}",
  country: "{{COUNTRY}}",
  timezone: ASSUMED_PRACTITIONER_TIMEZONE,
  defaultCurrency: "INR",
  // Working hours are unknown ({{WORKING_HOURS}}): a conservative weekday window is seeded so
  // consultation-window calculations have something to compute from. Replace before launch.
  businessHours: {
    mon: [{ open: "10:00", close: "18:00" }],
    tue: [{ open: "10:00", close: "18:00" }],
    wed: [{ open: "10:00", close: "18:00" }],
    thu: [{ open: "10:00", close: "18:00" }],
    fri: [{ open: "10:00", close: "18:00" }],
    sat: [{ open: "10:00", close: "14:00" }],
    sun: null,
  },
  inPersonAvailable: false,
  responseTimeHours: 24,
  // Booking engine defaults (CLAUDE.md Phase 4 contract): 24h lead time, 60-day horizon, 24h
  // reschedule notice, 30-minute slot steps. Admin-editable; {{BOOKING_RULES}} to confirm.
  leadTimeHours: 24,
  horizonDays: 60,
  rescheduleNoticeHours: 24,
  slotStepMinutes: 30,
};
