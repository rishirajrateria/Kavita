/**
 * Location tree for the geo-page engine. Server-only; DB when configured, seed otherwise.
 * Page components read only from here — Tier 2/3 cities are just more rows.
 */
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { locations } from "@/db/schema";
import { SEED_NS, hydrate, locationsSeed } from "@/content/seed";
import type { GeoService, Location } from "./types";

const fromSeed = (l: (typeof locationsSeed)[number]) =>
  hydrate<Location>(SEED_NS.locations, l.path, l);

const byName = (a: Location, b: Location) => a.name.localeCompare(b.name, "en");

/** The seven Tier-1 countries, alphabetical. */
export const getCountries = cache(async (): Promise<Location[]> => {
  const db = getDb();
  if (db) {
    return db.query.locations.findMany({
      where: eq(locations.type, "country"),
      orderBy: [asc(locations.name)],
    });
  }
  return locationsSeed
    .filter((l) => l.type === "country")
    .map(fromSeed)
    .sort(byName);
});

/** Cities flagged `isFeatured`, for the home page and hub "cities we serve" lists. */
export const getFeaturedCities = cache(async (): Promise<Location[]> => {
  const db = getDb();
  if (db) {
    return db.query.locations.findMany({
      where: and(eq(locations.type, "city"), eq(locations.isFeatured, true)),
      orderBy: [asc(locations.name)],
    });
  }
  return locationsSeed
    .filter((l) => l.type === "city" && l.isFeatured)
    .map(fromSeed)
    .sort(byName);
});

export const getLocationByPath = cache(async (path: string): Promise<Location | null> => {
  const db = getDb();
  if (db) {
    const row = await db.query.locations.findFirst({ where: eq(locations.path, path) });
    return row ?? null;
  }
  const seed = locationsSeed.find((l) => l.path === path);
  return seed ? fromSeed(seed) : null;
});

/** Canonical route of a geo page: `/astrologer/india/maharashtra/mumbai`. */
export function locationHref(location: Pick<Location, "path">, service: GeoService): string {
  return `/${service}/${location.path}`;
}
