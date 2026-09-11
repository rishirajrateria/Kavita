/**
 * The ~60 Tier-1 Indian cities (CLAUDE.md §6), each under its state/UT. Coordinates are the
 * conventional city-centre points to two decimals. Languages = state language(s) plus Hindi and
 * English, a consultation-demand assumption flagged in NEEDS-REAL-DATA.
 *
 * Naming: the brief lists "Aurangabad"; the city was officially renamed Chhatrapati
 * Sambhajinagar in 2023, so the record carries both (slug kept as `aurangabad`).
 */
import { INDIA, forCountry } from "./_define";
import type { LocationBase } from "../schema";

const { city } = forCountry(INDIA);
const L = (...langs: string[]) => ({ languages: [...langs, "Hindi", "English"] });

export const indiaCities: LocationBase[] = [
  city("india/maharashtra/mumbai", "Mumbai", 19.08, 72.88, "mega", {
    ...L("Marathi", "Gujarati"),
    featured: true,
  }),
  city("india/delhi/delhi", "Delhi", 28.61, 77.21, "mega", {
    ...L("Punjabi", "Urdu"),
    featured: true,
  }),
  city("india/karnataka/bengaluru", "Bengaluru", 12.97, 77.59, "mega", {
    ...L("Kannada", "Tamil", "Telugu"),
    featured: true,
  }),
  city("india/telangana/hyderabad", "Hyderabad", 17.39, 78.49, "mega", {
    ...L("Telugu", "Urdu"),
    featured: true,
  }),
  city("india/tamil-nadu/chennai", "Chennai", 13.08, 80.27, "mega", {
    ...L("Tamil"),
    featured: true,
  }),
  city("india/west-bengal/kolkata", "Kolkata", 22.57, 88.36, "mega", {
    ...L("Bengali"),
    featured: true,
  }),
  city("india/maharashtra/pune", "Pune", 18.52, 73.86, "mega", L("Marathi")),
  city("india/gujarat/ahmedabad", "Ahmedabad", 23.02, 72.57, "mega", L("Gujarati")),
  city("india/rajasthan/jaipur", "Jaipur", 26.91, 75.79, "large", L("Rajasthani")),
  city("india/gujarat/surat", "Surat", 21.17, 72.83, "large", L("Gujarati")),
  city("india/uttar-pradesh/lucknow", "Lucknow", 26.85, 80.95, "large", L("Urdu")),
  city("india/uttar-pradesh/kanpur", "Kanpur", 26.45, 80.33, "large"),
  city("india/maharashtra/nagpur", "Nagpur", 21.15, 79.09, "large", L("Marathi")),
  city("india/madhya-pradesh/indore", "Indore", 22.72, 75.86, "large"),
  city("india/madhya-pradesh/bhopal", "Bhopal", 23.26, 77.41, "large", L("Urdu")),
  city("india/bihar/patna", "Patna", 25.59, 85.14, "large", L("Maithili", "Bhojpuri")),
  city("india/gujarat/vadodara", "Vadodara", 22.31, 73.18, "large", L("Gujarati")),
  city("india/punjab/ludhiana", "Ludhiana", 30.9, 75.86, "large", L("Punjabi")),
  city("india/uttar-pradesh/agra", "Agra", 27.18, 78.01, "large"),
  city("india/maharashtra/nashik", "Nashik", 20.0, 73.79, "large", L("Marathi")),
  city("india/uttar-pradesh/varanasi", "Varanasi", 25.32, 82.99, "large", L("Bhojpuri")),
  city("india/gujarat/rajkot", "Rajkot", 22.3, 70.8, "large", L("Gujarati")),
  city("india/uttar-pradesh/meerut", "Meerut", 28.98, 77.71, "large"),
  city("india/punjab/amritsar", "Amritsar", 31.63, 74.87, "large", L("Punjabi")),
  city("india/tamil-nadu/coimbatore", "Coimbatore", 11.02, 76.96, "large", L("Tamil")),
  city("india/kerala/kochi", "Kochi", 9.93, 76.27, "medium", L("Malayalam")),
  city(
    "india/kerala/thiruvananthapuram",
    "Thiruvananthapuram",
    8.52,
    76.94,
    "medium",
    L("Malayalam"),
  ),
  city("india/chandigarh/chandigarh", "Chandigarh", 30.73, 76.78, "medium", L("Punjabi")),
  city("india/assam/guwahati", "Guwahati", 26.14, 91.74, "medium", L("Assamese", "Bengali")),
  city("india/odisha/bhubaneswar", "Bhubaneswar", 20.3, 85.82, "medium", L("Odia")),
  city("india/uttarakhand/dehradun", "Dehradun", 30.32, 78.03, "medium", L("Garhwali")),
  city("india/chhattisgarh/raipur", "Raipur", 21.25, 81.63, "medium", L("Chhattisgarhi")),
  city("india/jharkhand/ranchi", "Ranchi", 23.34, 85.31, "medium"),
  city("india/rajasthan/jodhpur", "Jodhpur", 26.24, 73.02, "medium", L("Marwari")),
  city("india/rajasthan/udaipur", "Udaipur", 24.58, 73.71, "small", L("Mewari")),
  city("india/karnataka/mysuru", "Mysuru", 12.3, 76.65, "medium", L("Kannada")),
  city(
    "india/karnataka/mangaluru",
    "Mangaluru",
    12.91,
    74.86,
    "small",
    L("Tulu", "Kannada", "Konkani"),
  ),
  city("india/tamil-nadu/madurai", "Madurai", 9.93, 78.12, "medium", L("Tamil")),
  city("india/andhra-pradesh/vijayawada", "Vijayawada", 16.51, 80.65, "medium", L("Telugu")),
  city("india/andhra-pradesh/visakhapatnam", "Visakhapatnam", 17.69, 83.22, "large", L("Telugu")),
  city("india/uttar-pradesh/noida", "Noida", 28.54, 77.39, "medium"),
  city("india/haryana/gurugram", "Gurugram", 28.46, 77.03, "medium", L("Punjabi")),
  city("india/uttar-pradesh/ghaziabad", "Ghaziabad", 28.67, 77.42, "large"),
  city("india/haryana/faridabad", "Faridabad", 28.41, 77.31, "large"),
  city("india/maharashtra/thane", "Thane", 19.22, 72.98, "large", L("Marathi")),
  city("india/maharashtra/navi-mumbai", "Navi Mumbai", 19.03, 73.02, "large", L("Marathi")),
  city("india/madhya-pradesh/gwalior", "Gwalior", 26.22, 78.18, "medium"),
  city("india/madhya-pradesh/jabalpur", "Jabalpur", 23.18, 79.99, "medium"),
  city(
    "india/maharashtra/aurangabad",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    19.88,
    75.34,
    "medium",
    {
      ...L("Marathi", "Urdu"),
      shortName: "Aurangabad",
    },
  ),
  city(
    "india/jammu-and-kashmir/srinagar",
    "Srinagar",
    34.08,
    74.8,
    "medium",
    L("Kashmiri", "Urdu"),
  ),
  city("india/jammu-and-kashmir/jammu", "Jammu", 32.73, 74.87, "medium", L("Dogri", "Punjabi")),
  city("india/himachal-pradesh/shimla", "Shimla", 31.1, 77.17, "small", L("Pahari")),
  city("india/goa/panaji", "Panaji", 15.5, 73.83, "small", L("Konkani", "Marathi")),
  city("india/puducherry/puducherry", "Puducherry", 11.94, 79.81, "small", L("Tamil")),
  city("india/tamil-nadu/tiruchirappalli", "Tiruchirappalli", 10.79, 78.7, "medium", L("Tamil")),
  city("india/tamil-nadu/salem", "Salem", 11.66, 78.15, "medium", L("Tamil")),
  city("india/karnataka/hubballi", "Hubballi", 15.36, 75.12, "medium", L("Kannada")),
  city("india/punjab/jalandhar", "Jalandhar", 31.33, 75.58, "medium", L("Punjabi")),
  city("india/uttar-pradesh/bareilly", "Bareilly", 28.37, 79.43, "medium", L("Urdu")),
  city("india/uttar-pradesh/aligarh", "Aligarh", 27.9, 78.09, "medium", L("Urdu")),
];
