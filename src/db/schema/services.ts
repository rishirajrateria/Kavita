/**
 * Services and their translations (CLAUDE.md §1, §10). Each service states whether it is
 * astrology-led, vastu-led or integrated — the site's core positioning.
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
  uuid,
} from "drizzle-orm/pg-core";
import { adminAll, publicSelect } from "./_policies";
import { currencyEnum, id, timestamps, type Currency } from "./_shared";

export const SERVICE_LEADS = ["astrology", "vastu", "integrated"] as const;
export type ServiceLead = (typeof SERVICE_LEADS)[number];
export const serviceLeadEnum = pgEnum("service_lead", SERVICE_LEADS);

export const DELIVERY_MODES = ["online_video", "online_phone", "in_person", "floor_plan"] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

/** Price in minor units per currency, e.g. `{ INR: 500000, USD: 9900 }`. */
export type ServicePrices = Partial<Record<Currency, number>>;

export const services = pgTable(
  "services",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    lead: serviceLeadEnum("lead").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
    /** Headline price in `currency`; null = "on request" until the client supplies prices. */
    priceMinor: integer("price_minor"),
    currency: currencyEnum("currency"),
    prices: jsonb("prices").$type<ServicePrices>().notNull().default({}),
    /** Free-text shown when `priceMinor` is null (e.g. "{{PRICE}}" until supplied). */
    priceNote: text("price_note"),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    whatToPrepare: text("what_to_prepare").array().notNull().default([]),
    whatYouReceive: text("what_you_receive").array().notNull().default([]),
    deliveryModes: text("delivery_modes").array().$type<DeliveryMode[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Anyone may read active services; inactive ones are admin-only drafts. */
    publicSelect("services", sql`${t.isActive} = true`),
    adminAll("services"),
    uniqueIndex("services_slug_uidx").on(t.slug),
    index("services_sort_idx").on(t.sortOrder),
  ],
);

export const serviceTranslations = pgTable(
  "service_translations",
  {
    id: id(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    /** BCP 47 locale, e.g. `hi-IN`. */
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    ...timestamps,
  },
  (t) => [
    /** Translations are public read; the parent service's `is_active` gate applies at query time. */
    publicSelect("service_translations"),
    adminAll("service_translations"),
    uniqueIndex("service_translations_service_locale_uidx").on(t.serviceId, t.locale),
  ],
);
