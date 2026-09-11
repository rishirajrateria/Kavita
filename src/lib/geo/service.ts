/**
 * The two geo-page families and the words each one uses (CLAUDE.md §5). Pure constants: every
 * template, metadata builder and sitemap reads labels from here so a rename is one edit.
 */
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";

/** Slug of the integrated service the geo CTA books (CLAUDE.md §1: the combined reading). */
export const INTEGRATED_SERVICE_SLUG = "integrated-life-reading";

export interface GeoServiceMeta {
  /** H1 / title label: "Astrologer in Mumbai". */
  label: string;
  /** Lower-case noun for prose. */
  noun: string;
  /** Title tail after the pipe (§8): `Vedic Astrology & Vastu` / `Vastu & Vedic Astrology`. */
  titleTail: string;
  /** Shorter tail used when the full title would exceed 60 characters. */
  titleTailShort: string;
  /** schema.org `serviceType` for the page's Service node. */
  serviceType: string;
  /** The other family, for the "counterpart" link. */
  counterpart: GeoService;
  /** Backdrop motif for the page: chart for astrology, compass for vastu. */
  motif: "chart" | "compass";
  /** `kind` passed to the OG image route. */
  ogKind: "astrologer" | "vastu";
}

export const GEO_SERVICE_META: Record<GeoService, GeoServiceMeta> = {
  astrologer: {
    label: "Astrologer",
    noun: "astrologer",
    titleTail: "Vedic Astrology & Vastu",
    titleTailShort: "Astrology & Vastu",
    serviceType: "Vedic astrology consultation with integrated vastu review",
    counterpart: "vastu-consultant",
    motif: "chart",
    ogKind: "astrologer",
  },
  "vastu-consultant": {
    label: "Vastu Consultant",
    noun: "vastu consultant",
    titleTail: "Vastu & Vedic Astrology",
    titleTailShort: "Vastu & Astrology",
    serviceType: "Vastu consultation with integrated Vedic astrology reading",
    counterpart: "astrologer",
    motif: "compass",
    ogKind: "vastu",
  },
};

/** The page's only H1: "{Service label} in {Name}". */
export function geoH1(loc: Pick<LocationRecord, "name">, service: GeoService): string {
  return `${GEO_SERVICE_META[service].label} in ${loc.name}`;
}

/** Display name, preferring `shortName` when the caller asks for brevity. */
export function placeName(loc: Pick<LocationRecord, "name" | "shortName">, short = false): string {
  return short ? (loc.shortName ?? loc.name) : loc.name;
}

/** Human label for the tier, used in eyebrows and answers. */
export function tierLabel(loc: Pick<LocationRecord, "type">): string {
  return loc.type === "country" ? "country" : loc.type === "state" ? "region" : "city";
}

/** Booking URL for the geo CTA: the integrated reading, pre-filled with the place. */
export function geoBookHref(loc: Pick<LocationRecord, "path">): string {
  return `/book?service=${INTEGRATED_SERVICE_SLUG}&location=${encodeURIComponent(loc.path)}`;
}
