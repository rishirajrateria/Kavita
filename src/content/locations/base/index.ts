/** Every base (geography-only) record, parent-first so a sequential DB insert satisfies the FK. */
import type { LocationBase } from "../schema";
import { auStates } from "./au-states";
import { caProvinces } from "./ca-provinces";
import { countries } from "./countries";
import { indiaCities } from "./india-cities";
import { indiaStates } from "./india-states";
import { internationalCities } from "./international-cities";
import { uaeEmirates } from "./uae-emirates";
import { ukRegions } from "./uk-regions";
import { usStates } from "./us-states";

export { BASE_CONTENT_UPDATED_AT } from "./_define";

export const baseLocations: readonly LocationBase[] = [
  ...countries,
  ...indiaStates,
  ...usStates,
  ...ukRegions,
  ...uaeEmirates,
  ...caProvinces,
  ...auStates,
  ...indiaCities,
  ...internationalCities,
];
