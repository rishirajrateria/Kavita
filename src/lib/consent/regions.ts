/**
 * Regions where third-party marketing tags wait for consent (CLAUDE.md §13E): the United
 * Kingdom, the EU/EEA and Switzerland. The admin can extend or shrink the list in
 * `consent_config`; this is the default and the reference set the tests use.
 */

export const EU_EEA_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EEA (non-EU)
  "IS",
  "LI",
  "NO",
] as const;

export const DEFAULT_CONSENT_REGIONS: readonly string[] = [
  ...EU_EEA_COUNTRIES,
  "GB",
  "CH",
  // Crown dependencies and Gibraltar follow UK GDPR-equivalent rules.
  "GI",
  "GG",
  "JE",
  "IM",
];

/** Normalise an edge geo header value to an upper-case ISO code, or `null` when unknown. */
export function normalizeRegion(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "ZZ") return null;
  return code;
}

export interface ConsentRegionPolicy {
  consentRegions: readonly string[];
  unknownRegionRequiresConsent: boolean;
}

/** Whether a visitor from `region` must consent before any third-party tag loads. */
export function regionRequiresConsent(
  region: string | null,
  policy: ConsentRegionPolicy = {
    consentRegions: DEFAULT_CONSENT_REGIONS,
    unknownRegionRequiresConsent: true,
  },
): boolean {
  const code = normalizeRegion(region);
  if (!code) return policy.unknownRegionRequiresConsent;
  return policy.consentRegions.includes(code);
}
