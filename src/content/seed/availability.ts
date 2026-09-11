/**
 * Default availability rules for the booking engine, used when no database is configured (and
 * when the `availability_rules` table is still empty). Derived from the seeded business hours in
 * `site-settings.ts` so the consultation-window copy and the bookable slots never disagree.
 *
 * ASSUMPTION (flagged, {{WORKING_HOURS}} in NEEDS-REAL-DATA.md): the practitioner's real hours
 * are unknown. Times are wall-clock in `site_settings.timezone` (`Asia/Kolkata` assumed).
 */
import type { AvailabilityRule, Weekday } from "@/db/schema";
import type { SeedRow } from "./_shared";
import { siteSettingsSeed } from "./site-settings";

/** True until the practitioner confirms her hours; surfaced by the availability API. */
export const AVAILABILITY_SEED_IS_PLACEHOLDER = true;

/** `site_settings.business_hours` keys → JS weekday numbers (0 = Sunday). */
export const WEEKDAY_NUMBER: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/** Stable key for `stableId(SEED_NS.availabilityRules, key)`. */
export function availabilityRuleSeedKey(rule: Pick<AvailabilityRule, "weekday" | "startTime">) {
  return `${rule.weekday}:${rule.startTime}`;
}

export const availabilityRulesSeed: SeedRow<AvailabilityRule>[] = (
  Object.keys(WEEKDAY_NUMBER) as Weekday[]
).flatMap((day) =>
  (siteSettingsSeed.businessHours[day] ?? []).map((interval) => ({
    weekday: WEEKDAY_NUMBER[day],
    startTime: interval.open,
    endTime: interval.close,
    serviceId: null,
    isActive: true,
  })),
);
