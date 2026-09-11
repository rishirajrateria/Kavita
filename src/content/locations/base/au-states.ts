/** Australia: 6 states + 2 mainland territories. Queensland, WA and NT observe no DST. */
import { AUSTRALIA, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { state } = forCountry(AUSTRALIA);
const tz = (timezone: string) => ({ timezone });

export const auStates: LocationBase[] = [
  state(
    "australia/australian-capital-territory",
    "Australian Capital Territory",
    "AU-ACT",
    -35.47,
    149.01,
    {
      shortName: "ACT",
    },
  ),
  state("australia/new-south-wales", "New South Wales", "AU-NSW", -31.25, 146.92, {
    shortName: "NSW",
  }),
  state("australia/northern-territory", "Northern Territory", "AU-NT", -19.49, 132.55, {
    timezone: "Australia/Darwin",
    shortName: "NT",
  }),
  state("australia/queensland", "Queensland", "AU-QLD", -22.58, 144.45, tz("Australia/Brisbane")),
  state(
    "australia/south-australia",
    "South Australia",
    "AU-SA",
    -30.0,
    136.21,
    tz("Australia/Adelaide"),
  ),
  state("australia/tasmania", "Tasmania", "AU-TAS", -42.04, 146.59, tz("Australia/Hobart")),
  state("australia/victoria", "Victoria", "AU-VIC", -37.47, 144.78, tz("Australia/Melbourne")),
  state("australia/western-australia", "Western Australia", "AU-WA", -25.04, 117.79, {
    timezone: "Australia/Perth",
    shortName: "WA",
  }),
];
