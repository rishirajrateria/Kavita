/**
 * The seven Tier-1 countries (CLAUDE.md §6). Coordinates are conventional country centroids;
 * `timezone` is the country's principal/most-populous zone and only feeds country-level
 * consultation windows (cities carry their own). `hreflang` forms the §8 reciprocal cluster.
 */
import { AUSTRALIA, CANADA, INDIA, SINGAPORE, UAE, UK, USA, country } from "./_define";
import type { LocationBase } from "../schema";

export const countries: LocationBase[] = [
  country({
    path: "india",
    name: "India",
    lat: 20.59,
    lng: 78.96,
    hreflang: "en-IN",
    defaults: INDIA,
  }),
  country({
    path: "united-states",
    name: "United States",
    lat: 37.09,
    lng: -95.71,
    hreflang: "en-US",
    defaults: USA,
  }),
  country({
    path: "united-kingdom",
    name: "United Kingdom",
    lat: 55.38,
    lng: -3.44,
    hreflang: "en-GB",
    defaults: UK,
  }),
  country({
    path: "united-arab-emirates",
    name: "United Arab Emirates",
    lat: 23.42,
    lng: 53.85,
    hreflang: "en-AE",
    populationTier: "large",
    defaults: UAE,
  }),
  country({
    path: "canada",
    name: "Canada",
    lat: 56.13,
    lng: -106.35,
    hreflang: "en-CA",
    defaults: CANADA,
  }),
  country({
    path: "australia",
    name: "Australia",
    lat: -25.27,
    lng: 133.78,
    hreflang: "en-AU",
    defaults: AUSTRALIA,
  }),
  country({
    path: "singapore",
    name: "Singapore",
    lat: 1.35,
    lng: 103.82,
    hreflang: "en-SG",
    populationTier: "large",
    defaults: SINGAPORE,
  }),
];
