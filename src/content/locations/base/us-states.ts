/**
 * All 50 US states plus the District of Columbia. Timezone = the state's principal zone
 * (Arizona `America/Phoenix`, no DST; Hawaii `Pacific/Honolulu`; Indiana/Michigan their own
 * tzdb zones). Coordinates are approximate geographic centres.
 */
import { USA, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { state } = forCountry(USA);
const tz = (timezone: string) => ({ timezone });
const CT = tz("America/Chicago");
const MT = tz("America/Denver");
const PT = tz("America/Los_Angeles");

export const usStates: LocationBase[] = [
  state("united-states/alabama", "Alabama", "US-AL", 32.81, -86.79, CT),
  state("united-states/alaska", "Alaska", "US-AK", 64.2, -149.49, tz("America/Anchorage")),
  state("united-states/arizona", "Arizona", "US-AZ", 34.05, -111.09, tz("America/Phoenix")),
  state("united-states/arkansas", "Arkansas", "US-AR", 34.97, -92.37, CT),
  state("united-states/california", "California", "US-CA", 36.78, -119.42, PT),
  state("united-states/colorado", "Colorado", "US-CO", 39.55, -105.78, MT),
  state("united-states/connecticut", "Connecticut", "US-CT", 41.6, -73.09),
  state("united-states/delaware", "Delaware", "US-DE", 39.0, -75.5),
  state("united-states/district-of-columbia", "District of Columbia", "US-DC", 38.91, -77.04, {
    shortName: "DC",
  }),
  state("united-states/florida", "Florida", "US-FL", 27.66, -81.52),
  state("united-states/georgia", "Georgia", "US-GA", 32.17, -82.9),
  state("united-states/hawaii", "Hawaii", "US-HI", 20.8, -156.33, tz("Pacific/Honolulu")),
  state("united-states/idaho", "Idaho", "US-ID", 44.07, -114.74, tz("America/Boise")),
  state("united-states/illinois", "Illinois", "US-IL", 40.63, -89.4, CT),
  state(
    "united-states/indiana",
    "Indiana",
    "US-IN",
    40.27,
    -86.13,
    tz("America/Indiana/Indianapolis"),
  ),
  state("united-states/iowa", "Iowa", "US-IA", 41.88, -93.1, CT),
  state("united-states/kansas", "Kansas", "US-KS", 39.01, -98.48, CT),
  state(
    "united-states/kentucky",
    "Kentucky",
    "US-KY",
    37.84,
    -84.27,
    tz("America/Kentucky/Louisville"),
  ),
  state("united-states/louisiana", "Louisiana", "US-LA", 30.98, -91.96, CT),
  state("united-states/maine", "Maine", "US-ME", 45.25, -69.45),
  state("united-states/maryland", "Maryland", "US-MD", 39.05, -76.64),
  state("united-states/massachusetts", "Massachusetts", "US-MA", 42.41, -71.38),
  state("united-states/michigan", "Michigan", "US-MI", 44.31, -85.6, tz("America/Detroit")),
  state("united-states/minnesota", "Minnesota", "US-MN", 46.73, -94.69, CT),
  state("united-states/mississippi", "Mississippi", "US-MS", 32.35, -89.4, CT),
  state("united-states/missouri", "Missouri", "US-MO", 37.96, -91.83, CT),
  state("united-states/montana", "Montana", "US-MT", 46.88, -110.36, MT),
  state("united-states/nebraska", "Nebraska", "US-NE", 41.49, -99.9, CT),
  state("united-states/nevada", "Nevada", "US-NV", 38.8, -116.42, PT),
  state("united-states/new-hampshire", "New Hampshire", "US-NH", 43.19, -71.57),
  state("united-states/new-jersey", "New Jersey", "US-NJ", 40.06, -74.41, {
    languages: ["English", "Hindi", "Gujarati", "Telugu", "Tamil"],
  }),
  state("united-states/new-mexico", "New Mexico", "US-NM", 34.52, -105.87, MT),
  state("united-states/new-york", "New York", "US-NY", 43.3, -74.22),
  state("united-states/north-carolina", "North Carolina", "US-NC", 35.76, -79.02),
  state("united-states/north-dakota", "North Dakota", "US-ND", 47.55, -101.0, CT),
  state("united-states/ohio", "Ohio", "US-OH", 40.42, -82.91),
  state("united-states/oklahoma", "Oklahoma", "US-OK", 35.01, -97.09, CT),
  state("united-states/oregon", "Oregon", "US-OR", 43.8, -120.55, PT),
  state("united-states/pennsylvania", "Pennsylvania", "US-PA", 41.2, -77.19),
  state("united-states/rhode-island", "Rhode Island", "US-RI", 41.58, -71.48),
  state("united-states/south-carolina", "South Carolina", "US-SC", 33.84, -81.16),
  state("united-states/south-dakota", "South Dakota", "US-SD", 43.97, -99.9, CT),
  state("united-states/tennessee", "Tennessee", "US-TN", 35.52, -86.58, CT),
  state("united-states/texas", "Texas", "US-TX", 31.97, -99.9, {
    ...CT,
    languages: ["English", "Hindi", "Telugu", "Gujarati"],
  }),
  state("united-states/utah", "Utah", "US-UT", 39.32, -111.09, MT),
  state("united-states/vermont", "Vermont", "US-VT", 44.56, -72.58),
  state("united-states/virginia", "Virginia", "US-VA", 37.43, -78.66),
  state("united-states/washington", "Washington", "US-WA", 47.75, -120.74, PT),
  state("united-states/west-virginia", "West Virginia", "US-WV", 38.6, -80.45),
  state("united-states/wisconsin", "Wisconsin", "US-WI", 43.78, -88.79, CT),
  state("united-states/wyoming", "Wyoming", "US-WY", 43.08, -107.29, MT),
];
