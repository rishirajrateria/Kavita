/**
 * Location tree for the geo-page engine. Server-only; DB when configured, content otherwise.
 * Page components read only from here — Tier 2/3 cities are just more rows.
 *
 * Everything derives from one cached `getAllLocations()` list (≈250 rows), so tree walks are
 * in-memory and both sources return identical `LocationRecord`s.
 */
import { asc } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { locations, type Location as LocationRow } from "@/db/schema";
import { getLocationRecords, isIndexable, isPublishable } from "@/content/locations";
import type { LocationRecord } from "@/content/locations/schema";
import {
  computeConsultationWindowFor,
  type ConsultationWindow,
  type ConsultationWindowSettings,
} from "./consultation-window";
import type { GeoService } from "./types";

export type { ConsultationWindow } from "./consultation-window";

const parentOf = (path: string): string | null => path.split("/").slice(0, -1).join("/") || null;

function fromRow(row: LocationRow): LocationRecord {
  return {
    slug: row.slug,
    path: row.path,
    parentPath: parentOf(row.path),
    type: row.type,
    name: row.name,
    ...(row.shortName ? { shortName: row.shortName } : {}),
    countryCode: row.countryCode,
    ...(row.regionCode ? { regionCode: row.regionCode } : {}),
    lat: Number(row.lat),
    lng: Number(row.lng),
    timezone: row.timezone,
    populationTier: row.populationTier,
    languages: row.languages,
    currency: row.currency,
    ...(row.hreflang ? { hreflang: row.hreflang } : {}),
    ...(row.isFeatured ? { isFeatured: true } : {}),
    contentUpdatedAt: row.contentUpdatedAt,
    researchStatus: row.researchStatus,
    ...(row.research ? { research: row.research } : {}),
  };
}

const byName = (a: LocationRecord, b: LocationRecord) => a.name.localeCompare(b.name, "en");

/** Every location, parent-first (countries, then states, then cities), each group by name. */
export const getAllLocations = cache(async (): Promise<LocationRecord[]> => {
  const db = getDb();
  const list = db
    ? (await db.query.locations.findMany({ orderBy: [asc(locations.path)] })).map(fromRow)
    : await getLocationRecords();
  const depth = (l: LocationRecord) => l.path.split("/").length;
  return [...list].sort((a, b) => depth(a) - depth(b) || byName(a, b));
});

export const getLocationByPath = cache(async (path: string): Promise<LocationRecord | null> => {
  const all = await getAllLocations();
  return all.find((l) => l.path === path) ?? null;
});

/** Direct children (states of a country, cities of a state), by name. */
export const getChildren = cache(async (path: string): Promise<LocationRecord[]> => {
  const all = await getAllLocations();
  return all.filter((l) => l.parentPath === path).sort(byName);
});

/**
 * Up to `limit` other locations under the same parent, publishable ones first, by name.
 * Countries' siblings are the other countries.
 */
export const getSiblings = cache(async (path: string, limit = 6): Promise<LocationRecord[]> => {
  const all = await getAllLocations();
  const parent = parentOf(path);
  return all
    .filter((l) => l.parentPath === parent && l.path !== path)
    .sort((a, b) => Number(isPublishable(b)) - Number(isPublishable(a)) || byName(a, b))
    .slice(0, limit);
});

/** Country → state ancestors of a path, root first; empty for a country. */
export const getAncestors = cache(async (path: string): Promise<LocationRecord[]> => {
  const all = await getAllLocations();
  const segments = path.split("/");
  const paths = segments.slice(0, -1).map((_, i) => segments.slice(0, i + 1).join("/"));
  return paths.map((p) => all.find((l) => l.path === p)).filter((l) => l !== undefined);
});

/** `complete` or `partial` — pages that render (partial renders `noindex`). */
export const getPublishableLocations = cache(async (): Promise<LocationRecord[]> => {
  return (await getAllLocations()).filter(isPublishable);
});

/** `complete` only — indexable and sitemapped. */
export const getIndexableLocations = cache(async (): Promise<LocationRecord[]> => {
  return (await getAllLocations()).filter(isIndexable);
});

/** The seven Tier-1 countries, alphabetical. */
export const getCountries = cache(async (): Promise<LocationRecord[]> => {
  return (await getAllLocations()).filter((l) => l.type === "country").sort(byName);
});

/** Cities flagged `isFeatured`, for the home page and hub "cities we serve" lists. */
export const getFeaturedCities = cache(async (): Promise<LocationRecord[]> => {
  return (await getAllLocations()).filter((l) => l.type === "city" && l.isFeatured).sort(byName);
});

/** Canonical route of a geo page: `/astrologer/india/maharashtra/mumbai`. */
export function locationHref(location: Pick<LocationRecord, "path">, service: GeoService): string {
  return `/${service}/${location.path}`;
}

/**
 * Today's offset between the location and the practitioner, and the hours a live session can
 * happen in the client's local time. Pure; `now` is injectable for tests.
 */
export function computeConsultationWindow(
  location: Pick<LocationRecord, "timezone">,
  settings: ConsultationWindowSettings,
  now?: Date,
): ConsultationWindow {
  return computeConsultationWindowFor(location, settings, now);
}
