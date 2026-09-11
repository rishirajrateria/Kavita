/**
 * The ~45 Tier-1 cities outside India (CLAUDE.md §6), each under its state/region so the
 * country → state → city hierarchy is uniform. Path decisions worth knowing:
 *
 *   New York            → united-states/new-york/new-york-city
 *   New Jersey (Edison) → united-states/new-jersey/edison
 *   SF Bay Area         → united-states/california/san-francisco-bay-area
 *   Washington DC       → united-states/district-of-columbia/washington-dc
 *   Dubai (city)        → united-arab-emirates/dubai/dubai (emirate is the parent)
 *   Surrey, BC          → canada/british-columbia/surrey
 *   Singapore           → singapore (country) / singapore (state-level "Singapore (city-state)",
 *                         no ISO 3166-2 code fits the whole island so none is set) /
 *                         singapore-city (the city record). Keeps every city three deep.
 */
import { AUSTRALIA, CANADA, SINGAPORE, UAE, UK, USA, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const us = forCountry(USA);
const uk = forCountry(UK);
const ae = forCountry(UAE);
const ca = forCountry(CANADA);
const au = forCountry(AUSTRALIA);
const sg = forCountry(SINGAPORE);
const tz = (timezone: string) => ({ timezone });

export const internationalCities: LocationBase[] = [
  // United States (18) -----------------------------------------------------------------------
  us.city("united-states/new-york/new-york-city", "New York City", 40.71, -74.01, "mega", {
    languages: ["English", "Hindi", "Bengali", "Gujarati", "Punjabi"],
    shortName: "New York",
    featured: true,
  }),
  us.city("united-states/new-jersey/edison", "Edison, New Jersey", 40.52, -74.41, "medium", {
    languages: ["English", "Hindi", "Gujarati", "Telugu", "Tamil"],
    shortName: "Edison",
  }),
  us.city(
    "united-states/illinois/chicago",
    "Chicago",
    41.88,
    -87.63,
    "mega",
    tz("America/Chicago"),
  ),
  us.city("united-states/texas/houston", "Houston", 29.76, -95.37, "mega", {
    timezone: "America/Chicago",
    languages: ["English", "Hindi", "Telugu", "Gujarati"],
  }),
  us.city("united-states/texas/dallas", "Dallas", 32.78, -96.8, "large", {
    timezone: "America/Chicago",
    languages: ["English", "Hindi", "Telugu", "Gujarati"],
  }),
  us.city("united-states/georgia/atlanta", "Atlanta", 33.75, -84.39, "large"),
  us.city(
    "united-states/california/san-francisco-bay-area",
    "San Francisco Bay Area",
    37.77,
    -122.42,
    "mega",
    {
      timezone: "America/Los_Angeles",
      languages: ["English", "Hindi", "Telugu", "Tamil", "Gujarati"],
      shortName: "Bay Area",
    },
  ),
  us.city("united-states/california/los-angeles", "Los Angeles", 34.05, -118.24, "mega", {
    timezone: "America/Los_Angeles",
    languages: ["English", "Hindi", "Gujarati", "Punjabi"],
  }),
  us.city("united-states/washington/seattle", "Seattle", 47.61, -122.33, "large", {
    timezone: "America/Los_Angeles",
    languages: ["English", "Hindi", "Telugu", "Tamil"],
  }),
  us.city("united-states/massachusetts/boston", "Boston", 42.36, -71.06, "large"),
  us.city(
    "united-states/district-of-columbia/washington-dc",
    "Washington, DC",
    38.91,
    -77.04,
    "large",
    {
      shortName: "Washington DC",
    },
  ),
  us.city("united-states/pennsylvania/philadelphia", "Philadelphia", 39.95, -75.17, "large"),
  us.city(
    "united-states/arizona/phoenix",
    "Phoenix",
    33.45,
    -112.07,
    "large",
    tz("America/Phoenix"),
  ),
  us.city("united-states/texas/austin", "Austin", 30.27, -97.74, "large", {
    timezone: "America/Chicago",
    languages: ["English", "Hindi", "Telugu"],
  }),
  us.city("united-states/north-carolina/charlotte", "Charlotte", 35.23, -80.84, "large"),
  us.city("united-states/michigan/detroit", "Detroit", 42.33, -83.05, "large", {
    timezone: "America/Detroit",
    languages: ["English", "Hindi", "Gujarati", "Punjabi"],
  }),
  us.city(
    "united-states/minnesota/minneapolis",
    "Minneapolis",
    44.98,
    -93.27,
    "large",
    tz("America/Chicago"),
  ),
  us.city("united-states/florida/tampa", "Tampa", 27.95, -82.46, "large"),

  // United Kingdom (10) ----------------------------------------------------------------------
  uk.city("united-kingdom/england/london", "London", 51.51, -0.13, "mega", {
    languages: ["English", "Hindi", "Punjabi", "Gujarati", "Bengali", "Tamil"],
    featured: true,
  }),
  uk.city("united-kingdom/england/birmingham", "Birmingham", 52.49, -1.89, "large"),
  uk.city("united-kingdom/england/leicester", "Leicester", 52.64, -1.13, "medium", {
    languages: ["English", "Gujarati", "Hindi", "Punjabi"],
  }),
  uk.city("united-kingdom/england/manchester", "Manchester", 53.48, -2.24, "large"),
  uk.city("united-kingdom/england/leeds", "Leeds", 53.8, -1.55, "large"),
  uk.city("united-kingdom/scotland/glasgow", "Glasgow", 55.86, -4.25, "large", {
    languages: ["English", "Punjabi", "Hindi"],
  }),
  uk.city("united-kingdom/england/slough", "Slough", 51.51, -0.59, "small"),
  uk.city("united-kingdom/england/wembley", "Wembley", 51.55, -0.3, "small", {
    languages: ["English", "Gujarati", "Hindi", "Punjabi"],
  }),
  uk.city("united-kingdom/england/southall", "Southall", 51.51, -0.38, "small", {
    languages: ["English", "Punjabi", "Hindi"],
  }),
  uk.city("united-kingdom/england/nottingham", "Nottingham", 52.95, -1.15, "medium"),

  // United Arab Emirates (4) -----------------------------------------------------------------
  ae.city("united-arab-emirates/dubai/dubai", "Dubai", 25.2, 55.27, "large", {
    languages: ["English", "Hindi", "Malayalam", "Urdu", "Tamil"],
    featured: true,
  }),
  ae.city("united-arab-emirates/abu-dhabi/abu-dhabi", "Abu Dhabi", 24.45, 54.38, "large"),
  ae.city("united-arab-emirates/sharjah/sharjah", "Sharjah", 25.35, 55.42, "large"),
  ae.city("united-arab-emirates/ajman/ajman", "Ajman", 25.41, 55.44, "medium"),

  // Canada (9) -------------------------------------------------------------------------------
  ca.city("canada/ontario/toronto", "Toronto", 43.65, -79.38, "mega", {
    languages: ["English", "Hindi", "Punjabi", "Gujarati", "Tamil"],
    featured: true,
  }),
  ca.city("canada/ontario/brampton", "Brampton", 43.73, -79.76, "large", {
    languages: ["English", "Punjabi", "Hindi", "Gujarati"],
  }),
  ca.city("canada/ontario/mississauga", "Mississauga", 43.59, -79.64, "large", {
    languages: ["English", "Hindi", "Punjabi", "Gujarati", "Tamil"],
  }),
  ca.city("canada/british-columbia/vancouver", "Vancouver", 49.28, -123.12, "large", {
    timezone: "America/Vancouver",
  }),
  ca.city("canada/british-columbia/surrey", "Surrey, BC", 49.19, -122.85, "large", {
    timezone: "America/Vancouver",
    languages: ["English", "Punjabi", "Hindi"],
    shortName: "Surrey",
  }),
  ca.city("canada/alberta/calgary", "Calgary", 51.05, -114.07, "large", tz("America/Edmonton")),
  ca.city("canada/alberta/edmonton", "Edmonton", 53.55, -113.49, "large", tz("America/Edmonton")),
  ca.city("canada/quebec/montreal", "Montreal", 45.5, -73.57, "large", {
    languages: ["English", "French", "Hindi", "Punjabi"],
  }),
  ca.city("canada/ontario/ottawa", "Ottawa", 45.42, -75.7, "large"),

  // Australia (5) ----------------------------------------------------------------------------
  au.city("australia/new-south-wales/sydney", "Sydney", -33.87, 151.21, "mega", {
    languages: ["English", "Hindi", "Punjabi", "Tamil", "Gujarati"],
    featured: true,
  }),
  au.city("australia/victoria/melbourne", "Melbourne", -37.81, 144.96, "mega", {
    timezone: "Australia/Melbourne",
    languages: ["English", "Hindi", "Punjabi", "Tamil", "Gujarati"],
  }),
  au.city(
    "australia/queensland/brisbane",
    "Brisbane",
    -27.47,
    153.03,
    "large",
    tz("Australia/Brisbane"),
  ),
  au.city(
    "australia/western-australia/perth",
    "Perth",
    -31.95,
    115.86,
    "large",
    tz("Australia/Perth"),
  ),
  au.city(
    "australia/south-australia/adelaide",
    "Adelaide",
    -34.93,
    138.6,
    "large",
    tz("Australia/Adelaide"),
  ),

  // Singapore (state-level record + city) ---------------------------------------------------
  {
    slug: "singapore",
    path: "singapore/singapore",
    parentPath: "singapore",
    type: "state",
    name: "Singapore (city-state)",
    shortName: "Singapore",
    countryCode: "SG",
    lat: 1.35,
    lng: 103.82,
    timezone: SINGAPORE.timezone,
    populationTier: "large",
    languages: SINGAPORE.languages,
    currency: SINGAPORE.currency,
    contentUpdatedAt: "2026-09-11",
  },
  sg.city("singapore/singapore/singapore-city", "Singapore", 1.29, 103.85, "large", {
    languages: ["English", "Tamil", "Hindi", "Malayalam"],
    shortName: "Singapore",
    featured: true,
  }),
];
