/**
 * Canada: 10 provinces + 3 territories. Saskatchewan is `America/Regina` (no DST);
 * Newfoundland is `America/St_Johns` (UTC−3:30). Quebec uses `America/Toronto` (tzdb canonical
 * for Montreal). Coordinates are approximate geographic centres.
 */
import { CANADA, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { state } = forCountry(CANADA);
const tz = (timezone: string) => ({ timezone });

export const caProvinces: LocationBase[] = [
  state("canada/alberta", "Alberta", "CA-AB", 53.93, -116.58, tz("America/Edmonton")),
  state("canada/british-columbia", "British Columbia", "CA-BC", 53.73, -127.65, {
    timezone: "America/Vancouver",
    shortName: "BC",
  }),
  state("canada/manitoba", "Manitoba", "CA-MB", 53.76, -98.81, tz("America/Winnipeg")),
  state("canada/new-brunswick", "New Brunswick", "CA-NB", 46.57, -66.46, tz("America/Moncton")),
  state("canada/newfoundland-and-labrador", "Newfoundland and Labrador", "CA-NL", 53.14, -57.66, {
    timezone: "America/St_Johns",
    shortName: "Newfoundland",
  }),
  state("canada/northwest-territories", "Northwest Territories", "CA-NT", 64.83, -124.85, {
    timezone: "America/Yellowknife",
    shortName: "NWT",
  }),
  state("canada/nova-scotia", "Nova Scotia", "CA-NS", 44.68, -63.74, tz("America/Halifax")),
  state("canada/nunavut", "Nunavut", "CA-NU", 70.3, -83.11, tz("America/Iqaluit")),
  state("canada/ontario", "Ontario", "CA-ON", 51.25, -85.32, {
    languages: ["English", "Hindi", "Punjabi", "Gujarati", "Tamil"],
  }),
  state("canada/prince-edward-island", "Prince Edward Island", "CA-PE", 46.51, -63.42, {
    timezone: "America/Halifax",
    shortName: "PEI",
  }),
  state("canada/quebec", "Quebec", "CA-QC", 52.94, -73.55, {
    languages: ["English", "French", "Hindi"],
  }),
  state("canada/saskatchewan", "Saskatchewan", "CA-SK", 52.94, -106.45, tz("America/Regina")),
  state("canada/yukon", "Yukon", "CA-YT", 64.28, -135.0, tz("America/Whitehorse")),
];
