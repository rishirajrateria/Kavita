/**
 * All 28 Indian states and 8 union territories (CLAUDE.md §6). ISO 3166-2:IN codes follow the
 * 2023 update (Chhattisgarh IN-CG, Odisha IN-OD, Telangana IN-TS, Uttarakhand IN-UK).
 * Coordinates are approximate geographic centres. Languages = the state's official/majority
 * language plus Hindi and English (consultation-demand assumption, flagged in NEEDS-REAL-DATA).
 *
 * Delhi: the NCT is the state-level record (`india/delhi`, "Delhi (NCT)") so the city
 * `india/delhi/delhi` keeps the same country → state → city hierarchy as every other city.
 * Chandigarh and Puducherry follow the same pattern (UT record + city record).
 */
import { INDIA, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { state } = forCountry(INDIA);
const L = (...langs: string[]) => ({ languages: [...langs, "Hindi", "English"] });

export const indiaStates: LocationBase[] = [
  // States (28) -----------------------------------------------------------------------------
  state("india/andhra-pradesh", "Andhra Pradesh", "IN-AP", 15.91, 79.74, L("Telugu")),
  state("india/arunachal-pradesh", "Arunachal Pradesh", "IN-AR", 28.22, 94.73, L("Nyishi", "Adi")),
  state("india/assam", "Assam", "IN-AS", 26.2, 92.94, L("Assamese", "Bengali")),
  state("india/bihar", "Bihar", "IN-BR", 25.1, 85.31, L("Maithili", "Bhojpuri")),
  state("india/chhattisgarh", "Chhattisgarh", "IN-CG", 21.28, 81.87, L("Chhattisgarhi")),
  state("india/goa", "Goa", "IN-GA", 15.3, 74.12, L("Konkani", "Marathi")),
  state("india/gujarat", "Gujarat", "IN-GJ", 22.26, 71.19, L("Gujarati")),
  state("india/haryana", "Haryana", "IN-HR", 29.06, 76.09, L("Haryanvi", "Punjabi")),
  state("india/himachal-pradesh", "Himachal Pradesh", "IN-HP", 31.1, 77.17, L("Pahari")),
  state("india/jharkhand", "Jharkhand", "IN-JH", 23.61, 85.28, L("Santali", "Bengali")),
  state("india/karnataka", "Karnataka", "IN-KA", 15.32, 75.71, L("Kannada")),
  state("india/kerala", "Kerala", "IN-KL", 10.85, 76.27, L("Malayalam")),
  state("india/madhya-pradesh", "Madhya Pradesh", "IN-MP", 22.97, 78.66),
  state("india/maharashtra", "Maharashtra", "IN-MH", 19.75, 75.71, L("Marathi")),
  state("india/manipur", "Manipur", "IN-MN", 24.66, 93.91, L("Meitei")),
  state("india/meghalaya", "Meghalaya", "IN-ML", 25.47, 91.37, L("Khasi", "Garo")),
  state("india/mizoram", "Mizoram", "IN-MZ", 23.16, 92.94, L("Mizo")),
  state("india/nagaland", "Nagaland", "IN-NL", 26.16, 94.56, L("Nagamese")),
  state("india/odisha", "Odisha", "IN-OD", 20.95, 85.1, L("Odia")),
  state("india/punjab", "Punjab", "IN-PB", 31.15, 75.34, L("Punjabi")),
  state("india/rajasthan", "Rajasthan", "IN-RJ", 27.02, 74.22, L("Rajasthani", "Marwari")),
  state("india/sikkim", "Sikkim", "IN-SK", 27.53, 88.51, L("Nepali")),
  state("india/tamil-nadu", "Tamil Nadu", "IN-TN", 11.13, 78.66, L("Tamil")),
  state("india/telangana", "Telangana", "IN-TS", 18.11, 79.02, L("Telugu", "Urdu")),
  state("india/tripura", "Tripura", "IN-TR", 23.94, 91.99, L("Bengali", "Kokborok")),
  state("india/uttar-pradesh", "Uttar Pradesh", "IN-UP", 26.85, 80.91, L("Urdu")),
  state("india/uttarakhand", "Uttarakhand", "IN-UK", 30.07, 79.02, L("Garhwali", "Kumaoni")),
  state("india/west-bengal", "West Bengal", "IN-WB", 22.99, 87.85, L("Bengali")),
  // Union territories (8) -------------------------------------------------------------------
  state("india/andaman-and-nicobar-islands", "Andaman and Nicobar Islands", "IN-AN", 11.74, 92.66, {
    ...L("Bengali", "Tamil"),
    shortName: "Andaman & Nicobar",
  }),
  state("india/chandigarh", "Chandigarh", "IN-CH", 30.73, 76.78, L("Punjabi")),
  state(
    "india/dadra-and-nagar-haveli-and-daman-and-diu",
    "Dadra and Nagar Haveli and Daman and Diu",
    "IN-DH",
    20.27,
    73.02,
    { ...L("Gujarati", "Marathi"), shortName: "Dadra & Nagar Haveli and Daman & Diu" },
  ),
  state("india/delhi", "Delhi (NCT)", "IN-DL", 28.7, 77.1, {
    ...L("Punjabi", "Urdu"),
    shortName: "Delhi",
  }),
  state("india/jammu-and-kashmir", "Jammu and Kashmir", "IN-JK", 33.78, 76.58, {
    ...L("Kashmiri", "Dogri", "Urdu"),
    shortName: "J&K",
  }),
  state("india/ladakh", "Ladakh", "IN-LA", 34.15, 77.58, L("Ladakhi", "Urdu")),
  state("india/lakshadweep", "Lakshadweep", "IN-LD", 10.57, 72.64, L("Malayalam")),
  state("india/puducherry", "Puducherry", "IN-PY", 11.94, 79.81, L("Tamil")),
];
