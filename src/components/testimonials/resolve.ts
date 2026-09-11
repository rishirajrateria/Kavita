/**
 * Resolve the location and service each testimonial refers to, so cards can show a place and
 * a service name and the page can filter by region. Location rows seeded from the content
 * files carry `stableId(SEED_NS.locations, path)`; with a database the ids are read directly
 * so admin-added rows resolve too.
 */
import "server-only";
import { getDb } from "@/db";
import { SEED_NS, stableId } from "@/content/seed/_shared";
import { getAllLocations, getServices, type LocationRecord, type Service } from "@/lib/data";

export interface ResolvedPlace {
  location: LocationRecord;
  /** Country-level record (the filter "region"). */
  country: LocationRecord;
}

export interface TestimonialContext {
  placeById: Map<string, ResolvedPlace>;
  serviceById: Map<string, Service>;
  services: Service[];
  /** Countries that have at least one resolvable location, by name. */
  regions: LocationRecord[];
}

export async function loadTestimonialContext(): Promise<TestimonialContext> {
  const [locations, services] = await Promise.all([getAllLocations(), getServices()]);
  const byPath = new Map(locations.map((l) => [l.path, l]));
  const countryOf = (l: LocationRecord) => byPath.get(l.path.split("/")[0] ?? l.path) ?? l;

  const idToPath = new Map<string, string>();
  const db = getDb();
  if (db) {
    const rows = await db.query.locations.findMany({ columns: { id: true, path: true } });
    for (const r of rows) idToPath.set(r.id, r.path);
  } else {
    for (const l of locations) idToPath.set(stableId(SEED_NS.locations, l.path), l.path);
  }

  const placeById = new Map<string, ResolvedPlace>();
  for (const [id, path] of idToPath) {
    const location = byPath.get(path);
    if (location) placeById.set(id, { location, country: countryOf(location) });
  }

  return {
    placeById,
    serviceById: new Map(services.map((s) => [s.id, s])),
    services,
    regions: locations.filter((l) => l.type === "country"),
  };
}
