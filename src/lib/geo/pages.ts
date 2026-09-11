/**
 * Every geo page that exists, for the sitemaps, `llms.txt` and the validation gate (Phase 2
 * contract). One entry per publishable location × service. `lastmod` is the record's real
 * `contentUpdatedAt` — never `new Date()` (CLAUDE.md §8).
 */
import type { LocationRecord, ResearchStatus } from "@/content/locations/schema";
import { getPublishableLocations, locationHref } from "@/lib/data/locations";
import { GEO_SERVICES, type GeoService } from "@/lib/data/types";

export interface GeoPage {
  service: GeoService;
  path: string;
  /** Site-relative href, e.g. `/astrologer/india/maharashtra/mumbai`. */
  href: string;
  /** `complete` = indexable + sitemapped; `partial` = rendered with `noindex`. */
  status: Exclude<ResearchStatus, "stub">;
  /** `YYYY-MM-DD` from the record. */
  lastmod: string;
  /** Countries only: the hreflang code of the page's cluster entry. */
  hreflang?: string;
  location: LocationRecord;
}

export async function listGeoPages(): Promise<GeoPage[]> {
  const locations = await getPublishableLocations();
  const pages: GeoPage[] = [];
  for (const service of GEO_SERVICES) {
    for (const location of locations) {
      if (location.researchStatus === "stub") continue;
      pages.push({
        service,
        path: location.path,
        href: locationHref(location, service),
        status: location.researchStatus,
        lastmod: location.contentUpdatedAt,
        hreflang: location.type === "country" ? location.hreflang : undefined,
        location,
      });
    }
  }
  return pages;
}

/** Only the pages search engines may index (status `complete`). */
export async function listIndexableGeoPages(): Promise<GeoPage[]> {
  return (await listGeoPages()).filter((p) => p.status === "complete");
}
