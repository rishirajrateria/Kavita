/**
 * Runtime-free types and constants for birth details. Safe to import from client code — the
 * encryption itself (`birth-details.ts`, Node `crypto`) must never reach the browser bundle.
 */
export const BIRTH_TIME_ACCURACY = ["exact", "approximate", "unknown"] as const;
export type BirthTimeAccuracy = (typeof BIRTH_TIME_ACCURACY)[number];

export interface BirthDetails {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM` local to the birthplace, or null when unknown. */
  time: string | null;
  place: string;
  timeAccuracy: BirthTimeAccuracy;
}
