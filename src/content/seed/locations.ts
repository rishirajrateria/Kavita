/**
 * Thin adapter from the typed location source (`src/content/locations`) to `locations` table
 * rows. The content folder is the source of truth; nothing is authored here.
 *
 * `locationsSeed` is the synchronous, base-only view (every row `stub`) kept for callers that
 * cannot await; `getLocationSeedRows()` is what `pnpm db:seed` uses — base + research merged,
 * status derived. Both are parent-first so a sequential insert satisfies the self-referencing FK.
 */
import type { Location } from "@/db/schema";
import { getLocationRecords, validatedBaseLocations } from "@/content/locations";
import type { LocationRecord } from "@/content/locations/schema";
import { SEED_NS, stableId, type SeedRow } from "./_shared";

/** Stable id of a location by its materialised path. */
export const locationId = (path: string) => stableId(SEED_NS.locations, path);

export type LocationSeed = SeedRow<Location>;

export function toLocationRow(record: LocationRecord): LocationSeed {
  return {
    parentId: record.parentPath ? locationId(record.parentPath) : null,
    type: record.type,
    name: record.name,
    shortName: record.shortName ?? null,
    slug: record.slug,
    path: record.path,
    countryCode: record.countryCode,
    regionCode: record.regionCode ?? null,
    lat: record.lat.toFixed(6),
    lng: record.lng.toFixed(6),
    timezone: record.timezone,
    populationTier: record.populationTier,
    languages: record.languages,
    currency: record.currency,
    hreflang: record.hreflang ?? null,
    isFeatured: record.isFeatured ?? false,
    researchStatus: record.researchStatus,
    research: record.research ?? null,
    contentUpdatedAt: record.contentUpdatedAt,
  };
}

export const locationsSeed: LocationSeed[] = validatedBaseLocations.map((base) =>
  toLocationRow({ ...base, researchStatus: "stub" }),
);

export async function getLocationSeedRows(): Promise<LocationSeed[]> {
  return (await getLocationRecords()).map(toLocationRow);
}
