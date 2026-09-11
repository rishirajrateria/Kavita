/** The seven emirates (ISO 3166-2:AE). Dubai the emirate is the parent of Dubai the city. */
import { UAE, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { state } = forCountry(UAE);

export const uaeEmirates: LocationBase[] = [
  state("united-arab-emirates/abu-dhabi", "Abu Dhabi", "AE-AZ", 24.45, 54.38),
  state("united-arab-emirates/ajman", "Ajman", "AE-AJ", 25.41, 55.44),
  state("united-arab-emirates/dubai", "Dubai", "AE-DU", 25.2, 55.27, {
    languages: ["English", "Hindi", "Malayalam", "Urdu", "Tamil"],
  }),
  state("united-arab-emirates/fujairah", "Fujairah", "AE-FU", 25.13, 56.33),
  state("united-arab-emirates/ras-al-khaimah", "Ras Al Khaimah", "AE-RK", 25.79, 55.94),
  state("united-arab-emirates/sharjah", "Sharjah", "AE-SH", 25.35, 55.42),
  state("united-arab-emirates/umm-al-quwain", "Umm Al Quwain", "AE-UQ", 25.55, 55.55),
];
