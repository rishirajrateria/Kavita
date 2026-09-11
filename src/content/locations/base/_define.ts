/**
 * Tiny builders so every base record is one line and the per-country constants (ISO country,
 * timezone, billing currency, default languages) are written once. Only verifiable geography
 * goes here — nothing from §7 research, nothing invented.
 */
import type { Currency, Hreflang, LocationBase, PopulationTier } from "../schema";

/** Date the base records were last edited by hand (feeds sitemap `lastmod`; never `now`). */
export const BASE_CONTENT_UPDATED_AT = "2026-09-11";

const split = (path: string) => {
  const segments = path.split("/");
  return {
    slug: segments[segments.length - 1] ?? path,
    parentPath: segments.slice(0, -1).join("/") || null,
  };
};

type CountryDefaults = {
  countryCode: string;
  timezone: string;
  currency: Currency;
  languages: string[];
};

type StateOpts = { timezone?: string; languages?: string[]; shortName?: string };
type CityOpts = StateOpts & { featured?: boolean };

export function country(a: {
  path: string;
  name: string;
  lat: number;
  lng: number;
  hreflang: Hreflang;
  populationTier?: PopulationTier;
  defaults: CountryDefaults;
}): LocationBase {
  return {
    ...split(a.path),
    path: a.path,
    type: "country",
    name: a.name,
    countryCode: a.defaults.countryCode,
    lat: a.lat,
    lng: a.lng,
    timezone: a.defaults.timezone,
    populationTier: a.populationTier ?? "mega",
    languages: a.defaults.languages,
    currency: a.defaults.currency,
    hreflang: a.hreflang,
    contentUpdatedAt: BASE_CONTENT_UPDATED_AT,
  };
}

/** Builders bound to one country's defaults. */
export function forCountry(d: CountryDefaults) {
  const state = (
    path: string,
    name: string,
    regionCode: string,
    lat: number,
    lng: number,
    opts: StateOpts = {},
  ): LocationBase => ({
    ...split(path),
    path,
    type: "state",
    name,
    ...(opts.shortName ? { shortName: opts.shortName } : {}),
    countryCode: d.countryCode,
    regionCode,
    lat,
    lng,
    timezone: opts.timezone ?? d.timezone,
    populationTier: "large",
    languages: opts.languages ?? d.languages,
    currency: d.currency,
    contentUpdatedAt: BASE_CONTENT_UPDATED_AT,
  });

  const city = (
    path: string,
    name: string,
    lat: number,
    lng: number,
    populationTier: PopulationTier,
    opts: CityOpts = {},
  ): LocationBase => ({
    ...split(path),
    path,
    type: "city",
    name,
    ...(opts.shortName ? { shortName: opts.shortName } : {}),
    countryCode: d.countryCode,
    lat,
    lng,
    timezone: opts.timezone ?? d.timezone,
    populationTier,
    languages: opts.languages ?? d.languages,
    currency: d.currency,
    ...(opts.featured ? { isFeatured: true } : {}),
    contentUpdatedAt: BASE_CONTENT_UPDATED_AT,
  });

  return { state, city };
}

// Per-country defaults, shared by the state and city files -----------------------------------

export const INDIA = {
  countryCode: "IN",
  timezone: "Asia/Kolkata",
  currency: "INR",
  languages: ["Hindi", "English"],
} satisfies CountryDefaults;

export const USA = {
  countryCode: "US",
  timezone: "America/New_York",
  currency: "USD",
  languages: ["English", "Hindi"],
} satisfies CountryDefaults;

export const UK = {
  countryCode: "GB",
  timezone: "Europe/London",
  currency: "GBP",
  languages: ["English", "Hindi", "Punjabi", "Gujarati"],
} satisfies CountryDefaults;

export const UAE = {
  countryCode: "AE",
  timezone: "Asia/Dubai",
  currency: "AED",
  languages: ["English", "Hindi", "Malayalam"],
} satisfies CountryDefaults;

export const CANADA = {
  countryCode: "CA",
  timezone: "America/Toronto",
  currency: "CAD",
  languages: ["English", "Hindi", "Punjabi"],
} satisfies CountryDefaults;

export const AUSTRALIA = {
  countryCode: "AU",
  timezone: "Australia/Sydney",
  currency: "AUD",
  languages: ["English", "Hindi", "Punjabi"],
} satisfies CountryDefaults;

export const SINGAPORE = {
  countryCode: "SG",
  timezone: "Asia/Singapore",
  currency: "SGD",
  languages: ["English", "Tamil", "Hindi"],
} satisfies CountryDefaults;
