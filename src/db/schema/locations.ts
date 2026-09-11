/**
 * Location tree for the geo-page engine (CLAUDE.md §6, §7). Country → state → city, self
 * referencing. Adding a Tier 2/3 city is just another row: page components read only from here.
 *
 * Columns mirror `LocationBase` in `src/content/locations/schema.ts` one-to-one; the §7 research
 * is one typed JSONB (`LocationResearch`) and `research_status` is the derived
 * stub / partial / complete flag — only `complete` rows are indexable, `stub` rows never render.
 * The content files are the source of truth; `pnpm db:seed` upserts them.
 */
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {
  HREFLANGS,
  LOCATION_CURRENCIES,
  LOCATION_TYPES,
  POPULATION_TIERS,
  RESEARCH_STATUSES,
  type LocationResearch,
} from "../../content/locations/schema";
import { adminAll, publicSelect } from "./_policies";
import { id, timestamps } from "./_shared";

export { LOCATION_TYPES, POPULATION_TIERS, RESEARCH_STATUSES };
export type {
  ClimateArchitecture,
  Landmark,
  LocationFaq,
  LocationResearch,
  LocationType,
  PopulationTier,
  RegionalTradition,
  ResearchStatus,
} from "../../content/locations/schema";

export const locationTypeEnum = pgEnum("location_type", LOCATION_TYPES);
export const researchStatusEnum = pgEnum("research_status", RESEARCH_STATUSES);
export const populationTierEnum = pgEnum("population_tier", POPULATION_TIERS);
/** Billing currency offered to clients in this location (superset of the §11 accepted set). */
export const locationCurrencyEnum = pgEnum("location_currency", LOCATION_CURRENCIES);
export const hreflangEnum = pgEnum("hreflang", HREFLANGS);

export const locations = pgTable(
  "locations",
  {
    id: id(),
    parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "restrict",
    }),
    type: locationTypeEnum("type").notNull(),
    name: text("name").notNull(),
    /** Short form for titles when `name` is long, e.g. "Bay Area". */
    shortName: text("short_name"),
    slug: text("slug").notNull(),
    /** Materialised path of slugs, e.g. `india/maharashtra/mumbai`. Unique. */
    path: text("path").notNull(),
    /** ISO 3166-1 alpha-2 of the country this location belongs to. */
    countryCode: text("country_code").notNull(),
    /** ISO 3166-2 subdivision code where meaningful, e.g. `IN-MH`; null otherwise. */
    regionCode: text("region_code"),
    lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
    lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
    /** IANA timezone; the offset relative to the practitioner is computed at render time. */
    timezone: text("timezone").notNull(),
    populationTier: populationTierEnum("population_tier").notNull(),
    /** Consultation languages commonly requested here. */
    languages: text("languages").array().notNull().default([]),
    currency: locationCurrencyEnum("currency").notNull(),
    /** Countries only: the §8 hreflang cluster member this country page represents. */
    hreflang: hreflangEnum("hreflang"),
    /** Shown in the home-page and hub "cities we serve" lists. */
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Derived from `research` by `deriveResearchStatus()`; stored for indexed queries. */
    researchStatus: researchStatusEnum("research_status").notNull().default("stub"),
    /** The §7 researched fields, hand-written per place; null for stubs. */
    research: jsonb("research").$type<LocationResearch>(),
    /** Real content mtime (`YYYY-MM-DD`) for sitemap `lastmod`; never `now()`. */
    contentUpdatedAt: date("content_updated_at", { mode: "string" }).notNull(),
    ...timestamps,
  },
  (t) => [
    /** The whole tree is public read: hubs need unpublished children for sibling/parent links
     *  and the Phase 2 gate decides what renders. Nothing here is personal data. */
    publicSelect("locations"),
    adminAll("locations"),
    uniqueIndex("locations_path_uidx").on(t.path),
    uniqueIndex("locations_parent_slug_uidx").on(t.parentId, t.slug),
    index("locations_type_idx").on(t.type),
    index("locations_country_code_idx").on(t.countryCode),
    index("locations_featured_idx").on(t.isFeatured, t.type),
    index("locations_research_status_idx").on(t.researchStatus, t.type),
  ],
);
