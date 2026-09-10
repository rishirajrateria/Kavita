/**
 * Location tree for the geo-page engine (CLAUDE.md §6, §7). Country → state → city, self
 * referencing. Adding a Tier 2/3 city is just another row: page components read only from here.
 *
 * The §7 research fields are typed JSONB. A page is never generated for a location whose
 * `researchStatus` is not `complete` — the Phase 2 validation gate enforces it.
 */
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { adminAll, publicSelect } from "./_policies";
import { currencyEnum, id, timestamps } from "./_shared";

export const LOCATION_TYPES = ["country", "state", "city"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];
export const locationTypeEnum = pgEnum("location_type", LOCATION_TYPES);

export const RESEARCH_STATUSES = ["complete", "partial", "stub"] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];
export const researchStatusEnum = pgEnum("research_status", RESEARCH_STATUSES);

export const POPULATION_TIERS = ["mega", "large", "medium", "small"] as const;
export type PopulationTier = (typeof POPULATION_TIERS)[number];
export const populationTierEnum = pgEnum("population_tier", POPULATION_TIERS);

// §7 research fields ---------------------------------------------------------------------------

export type Landmark = {
  name: string;
  kind: "temple" | "neighbourhood" | "landmark" | "district";
  note?: string;
};

export type RegionalTradition = {
  /** e.g. "North Indian (diamond)" | "South Indian (square)" | "East Indian (Bengali)" */
  chartStyle: string;
  /** e.g. "Purnimanta" | "Amanta" */
  monthReckoning: string;
  /** e.g. "Vikram Samvat", "Tamil solar calendar", "Malayalam (Kollam) era" */
  calendar: string;
  notes?: string;
};

export type ClimateArchitecture = {
  prevailingWind: string;
  sunExposure: string;
  housingStock: string;
  plotOrientation: string;
  notes?: string[];
};

export type ClientConcern = { concern: string; note?: string };

export type LocationFaq = { question: string; answer: string };

/** Local hours that overlap the practitioner's working day, in the location's own timezone. */
export type ConsultationWindow = { localStart: string; localEnd: string; note?: string };

export const locations = pgTable(
  "locations",
  {
    id: id(),
    parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "restrict",
    }),
    type: locationTypeEnum("type").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    /** Materialised path of slugs, e.g. `india/maharashtra/mumbai`. Unique. */
    path: text("path").notNull(),
    /** ISO 3166-1 alpha-2 of the country this location belongs to. */
    isoCountry: text("iso_country").notNull(),
    /** ISO 3166-2 subdivision code for states; null for countries and cities. */
    isoRegion: text("iso_region"),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    /** IANA timezone; the UTC offset relative to the practitioner is computed at render time. */
    timezone: text("timezone").notNull(),
    populationTier: populationTierEnum("population_tier"),
    /** Consultation languages commonly requested here. */
    languages: text("languages").array().notNull().default([]),
    currency: currencyEnum("currency").notNull(),
    researchStatus: researchStatusEnum("research_status").notNull().default("stub"),
    landmarks: jsonb("landmarks").$type<Landmark[]>(),
    tradition: jsonb("tradition").$type<RegionalTradition>(),
    climateArchitecture: jsonb("climate_architecture").$type<ClimateArchitecture>(),
    clientConcerns: jsonb("client_concerns").$type<ClientConcern[]>(),
    faqs: jsonb("faqs").$type<LocationFaq[]>(),
    consultationWindow: jsonb("consultation_window").$type<ConsultationWindow>(),
    /** Location-specific body copy (markdown), ≥700 words each when published. */
    bodyAstrologyMd: text("body_astrology_md"),
    bodyVastuMd: text("body_vastu_md"),
    isPublished: boolean("is_published").notNull().default(false),
    /** Shown in the home-page and hub "cities we serve" lists. */
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Real content mtime for sitemap `lastmod`; never `now()`. */
    contentUpdatedAt: timestamp("content_updated_at", { withTimezone: true, mode: "date" }),
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
    index("locations_iso_country_idx").on(t.isoCountry),
    index("locations_featured_idx").on(t.isFeatured, t.type),
  ],
);
