/**
 * Site-wide settings, social profiles, third-party integrations, search-engine verification
 * and visitor consent (CLAUDE.md §10, §13).
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
import { adminAll, publicInsert, publicSelect } from "./_policies";
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

// ---------------------------------------------------------------------------------------------
// integrations — every pixel/tag/API connection, off until an ID is entered (§13).
// ---------------------------------------------------------------------------------------------

export const INTEGRATION_PROVIDERS = [
  "google_search_console",
  "bing_webmaster",
  "meta_pixel",
  "meta_capi",
  "google_tag",
  "google_ads",
  "ga4",
  "linkedin_insight",
  "pinterest_tag",
  "tiktok_pixel",
  "microsoft_uet",
  "gtm",
  "custom_head",
  "custom_body",
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];
export const integrationProviderEnum = pgEnum("integration_provider", INTEGRATION_PROVIDERS);

/** Provider-specific config; secrets inside it are encrypted by the admin layer before insert. */
export type IntegrationConfig = Record<string, string | number | boolean | null>;

export const integrations = pgTable(
  "integrations",
  {
    id: id(),
    provider: integrationProviderEnum("provider").notNull(),
    config: jsonb("config").$type<IntegrationConfig>().notNull().default({}),
    isEnabled: boolean("is_enabled").notNull().default(false),
    /** ISO 3166-1 alpha-2 codes the tag may load in; empty = everywhere (subject to consent). */
    loadsInRegions: text("loads_in_regions").array().notNull().default([]),
    updatedBy: text("updated_by"),
    ...timestamps,
  },
  (t) => [
    /** Contains credentials: admin-only; the server component reads it with the service role. */
    adminAll("integrations"),
    uniqueIndex("integrations_provider_uidx").on(t.provider),
  ],
);

// ---------------------------------------------------------------------------------------------
// verification_tags — search-engine site verification (meta tag or hosted file).
// ---------------------------------------------------------------------------------------------

export const VERIFICATION_KINDS = ["meta", "file"] as const;
export const verificationKindEnum = pgEnum("verification_kind", VERIFICATION_KINDS);

export const verificationTags = pgTable(
  "verification_tags",
  {
    id: id(),
    /** e.g. google, bing, pinterest, facebook_domain, yandex, other */
    provider: text("provider").notNull(),
    kind: verificationKindEnum("kind").notNull(),
    metaName: text("meta_name"),
    metaContent: text("meta_content"),
    filePath: text("file_path"),
    fileContent: text("file_content"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; rendered server-side, never queried from the browser. */
    adminAll("verification_tags"),
    uniqueIndex("verification_tags_provider_kind_uidx").on(t.provider, t.kind),
  ],
);

// ---------------------------------------------------------------------------------------------
// consent_log — append-only record of cookie/pixel consent choices (§13E).
// ---------------------------------------------------------------------------------------------

export type ConsentChoices = { analytics: boolean; marketing: boolean };

export const consentLog = pgTable(
  "consent_log",
  {
    id: id(),
    /** Random anonymous visitor id kept in the consent cookie; never a user identity. */
    visitorId: text("visitor_id").notNull(),
    /** ISO 3166-1 alpha-2 from the edge geo header. */
    region: text("region"),
    choices: jsonb("choices").$type<ConsentChoices>().notNull(),
    policyVersion: text("policy_version").notNull(),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    /** Visitors may record a choice but never read the log back. */
    publicInsert("consent_log", sql`true`),
    adminAll("consent_log"),
    index("consent_log_visitor_idx").on(t.visitorId, t.createdAt),
  ],
);
