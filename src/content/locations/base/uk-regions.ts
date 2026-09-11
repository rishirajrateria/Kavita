/** The four UK nations (ISO 3166-2:GB). London and the other cities sit under England/Scotland. */
import { UK, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { state } = forCountry(UK);

export const ukRegions: LocationBase[] = [
  state("united-kingdom/england", "England", "GB-ENG", 52.36, -1.17),
  state("united-kingdom/northern-ireland", "Northern Ireland", "GB-NIR", 54.79, -6.49, {
    languages: ["English", "Hindi"],
  }),
  state("united-kingdom/scotland", "Scotland", "GB-SCT", 56.49, -4.2, {
    languages: ["English", "Hindi", "Punjabi"],
  }),
  state("united-kingdom/wales", "Wales", "GB-WLS", 52.13, -3.78, {
    languages: ["English", "Hindi"],
  }),
];
