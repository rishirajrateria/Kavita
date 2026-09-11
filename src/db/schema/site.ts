/**
 * Site-wide settings and social profiles (CLAUDE.md §10, §13A). Integrations, verification
 * tags and consent moved to `integrations.ts` in Phase 6.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { adminAll, publicSelect } from "./_policies";
import { currencyEnum, id, timestamps } from "./_shared";

// ---------------------------------------------------------------------------------------------
// site_settings — single row, the ONE source of truth for NAP, hours, timezone, currency.
// ---------------------------------------------------------------------------------------------

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** `{ open: "10:00", close: "18:00" }` in the practitioner's timezone; `null` = closed. */
export type BusinessHoursInterval = { open: string; close: string };
export type BusinessHours = Record<Weekday, BusinessHoursInterval[] | null>;

export const siteSettings = pgTable(
  "site_settings",
  {
    id: id(),
    brandName: text("brand_name").notNull(),
    legalEntity: text("legal_entity").notNull(),
    practitionerName: text("practitioner_name").notNull(),
    tagline: text("tagline").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email").notNull(),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    addressPostalCode: text("address_postal_code"),
    addressRegion: text("address_region"),
    city: text("city").notNull(),
    country: text("country").notNull(),
    /** IANA timezone of the practitioner; every consultation window is computed from this. */
    timezone: text("timezone").notNull(),
    defaultCurrency: currencyEnum("default_currency").notNull().default("INR"),
    businessHours: jsonb("business_hours").$type<BusinessHours>().notNull(),
    inPersonAvailable: boolean("in_person_available").notNull().default(false),
    /** Typical time to reply to an enquiry, shown in key-facts blocks. */
    responseTimeHours: integer("response_time_hours").notNull().default(24),
    // --- Booking engine settings (Phase 4). Read by src/lib/booking/*; admin-editable. ---
    /** Earliest bookable slot is this many hours from now. */
    leadTimeHours: integer("lead_time_hours").notNull().default(24),
    /** Latest bookable slot is this many days from now. */
    horizonDays: integer("horizon_days").notNull().default(60),
    /** A client may reschedule only while the session is at least this many hours away. */
    rescheduleNoticeHours: integer("reschedule_notice_hours").notNull().default(24),
    /** Slot start times are offered every N minutes inside an availability window. */
    slotStepMinutes: integer("slot_step_minutes").notNull().default(30),
    ...timestamps,
  },
  () => [
    /** Anyone may read the single settings row: it feeds the footer, contact page and schema. */
    publicSelect("site_settings"),
    adminAll("site_settings"),
    /** Enforces the single-row invariant. */
    uniqueIndex("site_settings_singleton_uidx").on(sql`(true)`),
  ],
);

// ---------------------------------------------------------------------------------------------
// social_links
// ---------------------------------------------------------------------------------------------

export const SOCIAL_PLATFORMS = [
  "instagram",
  "youtube",
  "facebook",
  "linkedin",
  "x",
  "whatsapp",
  "telegram",
  "pinterest",
  "threads",
  "google_business",
  "other",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const socialPlatformEnum = pgEnum("social_platform", SOCIAL_PLATFORMS);

export const socialLinks = pgTable(
  "social_links",
  {
    id: id(),
    platform: socialPlatformEnum("platform").notNull(),
    url: text("url").notNull(),
    label: text("label").notNull(),
    /** Key of the inline SVG icon component to render (never an icon font or CDN). */
    icon: text("icon").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    showInFooter: boolean("show_in_footer").notNull().default(true),
    showInHeader: boolean("show_in_header").notNull().default(false),
    /** Emit in the `sameAs` array of Person / ProfessionalService schema. */
    includeInSameas: boolean("include_in_sameas").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Anyone may read visible links; hidden links stay admin-only. */
    publicSelect("social_links", sql`${t.isVisible} = true`),
    adminAll("social_links"),
    uniqueIndex("social_links_url_uidx").on(t.url),
    index("social_links_sort_idx").on(t.sortOrder),
  ],
);
