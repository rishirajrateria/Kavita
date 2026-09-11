/**
 * IANA zones offered in the booking-flow selector, grouped by target market (CLAUDE.md §2).
 * The visitor's detected zone is always offered too, even when it is not in this list.
 */
export interface ZoneGroup {
  label: string;
  zones: readonly string[];
}

export const ZONE_GROUPS: readonly ZoneGroup[] = [
  { label: "India", zones: ["Asia/Kolkata"] },
  {
    label: "United States",
    zones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Phoenix",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
    ],
  },
  { label: "United Kingdom & Ireland", zones: ["Europe/London", "Europe/Dublin"] },
  {
    label: "United Arab Emirates & Gulf",
    zones: [
      "Asia/Dubai",
      "Asia/Riyadh",
      "Asia/Qatar",
      "Asia/Muscat",
      "Asia/Bahrain",
      "Asia/Kuwait",
    ],
  },
  {
    label: "Canada",
    zones: [
      "America/Toronto",
      "America/Vancouver",
      "America/Edmonton",
      "America/Winnipeg",
      "America/Halifax",
      "America/St_Johns",
    ],
  },
  {
    label: "Australia & New Zealand",
    zones: [
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Perth",
      "Australia/Adelaide",
      "Australia/Darwin",
      "Australia/Hobart",
      "Pacific/Auckland",
    ],
  },
  {
    label: "Singapore & South-East Asia",
    zones: [
      "Asia/Singapore",
      "Asia/Kuala_Lumpur",
      "Asia/Hong_Kong",
      "Asia/Bangkok",
      "Asia/Jakarta",
    ],
  },
  {
    label: "Europe",
    zones: [
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Amsterdam",
      "Europe/Zurich",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Stockholm",
      "Europe/Athens",
    ],
  },
  {
    label: "Elsewhere",
    zones: [
      "Asia/Karachi",
      "Asia/Dhaka",
      "Asia/Kathmandu",
      "Asia/Colombo",
      "Asia/Tokyo",
      "Africa/Johannesburg",
      "Africa/Nairobi",
      "America/Sao_Paulo",
      "America/Mexico_City",
      "Etc/UTC",
    ],
  },
];

export const ALL_ZONES: readonly string[] = ZONE_GROUPS.flatMap((g) => g.zones);

/** True when `Intl` on this runtime knows the zone. */
export function isKnownZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The device zone, or null when the runtime does not report one. */
export function detectZone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isKnownZone(zone) ? zone : null;
  } catch {
    return null;
  }
}
