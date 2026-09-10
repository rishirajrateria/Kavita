/**
 * Phase 1 location tree: the 7 Tier-1 countries, the six intermediate states/regions needed for
 * tree integrity, and six top cities. Every row is `researchStatus: "stub"` — the §7 research
 * fields are deliberately empty and are filled in Phase 2. Only verifiable geographic facts
 * (ISO codes, IANA timezones, coordinates, common consultation languages) are included.
 *
 * `currency` is the billing currency offered to clients there, chosen from the four the practice
 * accepts (INR, USD, GBP, AED) — not the local currency.
 */
import type { Location } from "@/db/schema";
import { SEED_NS, stableId, type SeedRow } from "./_shared";

/** Stable id of a location by its materialised path. */
export const locationId = (path: string) => stableId(SEED_NS.locations, path);

type LocationSeed = SeedRow<Location>;

const research = {
  researchStatus: "stub",
  landmarks: null,
  tradition: null,
  climateArchitecture: null,
  clientConcerns: null,
  faqs: null,
  consultationWindow: null,
  bodyAstrologyMd: null,
  bodyVastuMd: null,
  isPublished: false,
  isFeatured: false,
  contentUpdatedAt: null,
} satisfies Partial<LocationSeed>;

type Args = {
  type: Location["type"];
  name: string;
  path: string;
  isoCountry: string;
  isoRegion?: string;
  lat: string;
  lng: string;
  timezone: string;
  populationTier?: Location["populationTier"];
  languages: string[];
  currency: Location["currency"];
  featured?: boolean;
};

function loc(a: Args): LocationSeed {
  const segments = a.path.split("/");
  const slug = segments[segments.length - 1] ?? a.path;
  const parentPath = segments.slice(0, -1).join("/");
  return {
    ...research,
    parentId: parentPath ? locationId(parentPath) : null,
    type: a.type,
    name: a.name,
    slug,
    path: a.path,
    isoCountry: a.isoCountry,
    isoRegion: a.isoRegion ?? null,
    lat: a.lat,
    lng: a.lng,
    timezone: a.timezone,
    populationTier: a.populationTier ?? null,
    languages: a.languages,
    currency: a.currency,
    isFeatured: a.featured ?? false,
  };
}

/** Ordered parent-first so a plain sequential insert satisfies the self-referencing FK. */
export const locationsSeed: LocationSeed[] = [
  // Countries -----------------------------------------------------------------------------
  loc({
    type: "country",
    name: "India",
    path: "india",
    isoCountry: "IN",
    lat: "20.593684",
    lng: "78.962880",
    timezone: "Asia/Kolkata",
    languages: ["English", "Hindi"],
    currency: "INR",
  }),
  loc({
    type: "country",
    name: "United States",
    path: "united-states",
    isoCountry: "US",
    lat: "37.090240",
    lng: "-95.712891",
    timezone: "America/New_York",
    languages: ["English", "Hindi"],
    currency: "USD",
  }),
  loc({
    type: "country",
    name: "United Kingdom",
    path: "united-kingdom",
    isoCountry: "GB",
    lat: "55.378051",
    lng: "-3.435973",
    timezone: "Europe/London",
    languages: ["English", "Hindi", "Punjabi", "Gujarati"],
    currency: "GBP",
  }),
  loc({
    type: "country",
    name: "United Arab Emirates",
    path: "united-arab-emirates",
    isoCountry: "AE",
    lat: "23.424076",
    lng: "53.847818",
    timezone: "Asia/Dubai",
    languages: ["English", "Hindi", "Malayalam"],
    currency: "AED",
  }),
  loc({
    type: "country",
    name: "Canada",
    path: "canada",
    isoCountry: "CA",
    lat: "56.130366",
    lng: "-106.346771",
    timezone: "America/Toronto",
    languages: ["English", "Hindi", "Punjabi"],
    currency: "USD",
  }),
  loc({
    type: "country",
    name: "Australia",
    path: "australia",
    isoCountry: "AU",
    lat: "-25.274398",
    lng: "133.775136",
    timezone: "Australia/Sydney",
    languages: ["English", "Hindi", "Punjabi"],
    currency: "USD",
  }),
  loc({
    type: "country",
    name: "Singapore",
    path: "singapore",
    isoCountry: "SG",
    lat: "1.352083",
    lng: "103.819836",
    timezone: "Asia/Singapore",
    languages: ["English", "Tamil", "Hindi"],
    currency: "USD",
  }),

  // States / regions (parents of the Phase 1 cities) --------------------------------------
  loc({
    type: "state",
    name: "Maharashtra",
    path: "india/maharashtra",
    isoCountry: "IN",
    isoRegion: "IN-MH",
    lat: "19.751480",
    lng: "75.713888",
    timezone: "Asia/Kolkata",
    languages: ["Marathi", "Hindi", "English"],
    currency: "INR",
  }),
  loc({
    type: "state",
    name: "Delhi",
    path: "india/delhi",
    isoCountry: "IN",
    isoRegion: "IN-DL",
    lat: "28.704060",
    lng: "77.102493",
    timezone: "Asia/Kolkata",
    languages: ["Hindi", "English", "Punjabi"],
    currency: "INR",
  }),
  loc({
    type: "state",
    name: "Karnataka",
    path: "india/karnataka",
    isoCountry: "IN",
    isoRegion: "IN-KA",
    lat: "15.317277",
    lng: "75.713890",
    timezone: "Asia/Kolkata",
    languages: ["Kannada", "English", "Hindi"],
    currency: "INR",
  }),
  loc({
    type: "state",
    name: "England",
    path: "united-kingdom/england",
    isoCountry: "GB",
    isoRegion: "GB-ENG",
    lat: "52.355518",
    lng: "-1.174320",
    timezone: "Europe/London",
    languages: ["English", "Hindi", "Punjabi", "Gujarati"],
    currency: "GBP",
  }),
  loc({
    type: "state",
    name: "Dubai",
    path: "united-arab-emirates/dubai",
    isoCountry: "AE",
    isoRegion: "AE-DU",
    lat: "25.204849",
    lng: "55.270783",
    timezone: "Asia/Dubai",
    languages: ["English", "Hindi", "Malayalam"],
    currency: "AED",
  }),
  loc({
    type: "state",
    name: "Ontario",
    path: "canada/ontario",
    isoCountry: "CA",
    isoRegion: "CA-ON",
    lat: "51.253775",
    lng: "-85.323214",
    timezone: "America/Toronto",
    languages: ["English", "Hindi", "Punjabi", "Gujarati"],
    currency: "USD",
  }),

  // Cities ------------------------------------------------------------------------------
  loc({
    type: "city",
    name: "Mumbai",
    path: "india/maharashtra/mumbai",
    isoCountry: "IN",
    lat: "19.076090",
    lng: "72.877426",
    timezone: "Asia/Kolkata",
    featured: true,
    populationTier: "mega",
    languages: ["Marathi", "Hindi", "English", "Gujarati"],
    currency: "INR",
  }),
  loc({
    type: "city",
    name: "Delhi",
    path: "india/delhi/delhi",
    isoCountry: "IN",
    lat: "28.613939",
    lng: "77.209021",
    timezone: "Asia/Kolkata",
    featured: true,
    populationTier: "mega",
    languages: ["Hindi", "English", "Punjabi"],
    currency: "INR",
  }),
  loc({
    type: "city",
    name: "Bengaluru",
    path: "india/karnataka/bengaluru",
    isoCountry: "IN",
    lat: "12.971599",
    lng: "77.594566",
    timezone: "Asia/Kolkata",
    featured: true,
    populationTier: "mega",
    languages: ["Kannada", "English", "Hindi", "Tamil", "Telugu"],
    currency: "INR",
  }),
  loc({
    type: "city",
    name: "London",
    path: "united-kingdom/england/london",
    isoCountry: "GB",
    lat: "51.507351",
    lng: "-0.127758",
    timezone: "Europe/London",
    featured: true,
    populationTier: "mega",
    languages: ["English", "Hindi", "Punjabi", "Gujarati", "Bengali"],
    currency: "GBP",
  }),
  loc({
    type: "city",
    name: "Dubai",
    path: "united-arab-emirates/dubai/dubai",
    isoCountry: "AE",
    lat: "25.204849",
    lng: "55.270783",
    timezone: "Asia/Dubai",
    featured: true,
    populationTier: "large",
    languages: ["English", "Hindi", "Malayalam", "Urdu"],
    currency: "AED",
  }),
  loc({
    type: "city",
    name: "Toronto",
    path: "canada/ontario/toronto",
    isoCountry: "CA",
    lat: "43.653226",
    lng: "-79.383184",
    timezone: "America/Toronto",
    featured: true,
    populationTier: "large",
    languages: ["English", "Hindi", "Punjabi", "Gujarati", "Tamil"],
    currency: "USD",
  }),
];
