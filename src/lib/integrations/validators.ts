/**
 * Format validators for integration IDs, keys and URLs (Phase 6). Pure functions, unit-tested in
 * `tests/integrations/validators.test.ts`. Each returns `null` when valid or a short, owner-facing
 * error message. Patterns are deliberately permissive about length so a legitimate new ID format
 * is not rejected; they exist to catch pasted labels, URLs and whitespace, not to be exhaustive.
 */

export type Validator = (value: string) => string | null;

function pattern(re: RegExp, message: string): Validator {
  return (value) => (re.test(value.trim()) ? null : message);
}

export const validateMetaPixelId: Validator = pattern(
  /^\d{15,16}$/,
  "A Meta Pixel ID is 15–16 digits (Events Manager → Data sources).",
);

export const validateMetaDomainVerification: Validator = pattern(
  /^[a-z0-9]{16,80}$/i,
  "Paste only the content value of the facebook-domain-verification meta tag.",
);

export const validateGoogleTagId: Validator = pattern(
  /^(G|GT|AW|DC)-[A-Z0-9]{4,16}$/,
  "A Google tag ID looks like G-XXXXXXX, GT-XXXXXXX or AW-XXXXXXX.",
);

export const validateGa4MeasurementId: Validator = pattern(
  /^G-[A-Z0-9]{4,16}$/,
  "A GA4 measurement ID looks like G-XXXXXXXXXX.",
);

export const validateGoogleAdsConversionId: Validator = pattern(
  /^AW-\d{6,14}$/,
  "A Google Ads conversion ID looks like AW-123456789.",
);

export const validateGoogleAdsLabel: Validator = pattern(
  /^[A-Za-z0-9_-]{4,64}$/,
  "The conversion label is the short code after the slash in AW-…/LABEL.",
);

export const validateGtmContainerId: Validator = pattern(
  /^GTM-[A-Z0-9]{4,12}$/,
  "A Tag Manager container ID looks like GTM-XXXXXXX.",
);

export const validateLinkedInPartnerId: Validator = pattern(
  /^\d{4,14}$/,
  "The LinkedIn partner ID is a number from Campaign Manager → Insight Tag.",
);

export const validateLinkedInConversionId: Validator = pattern(
  /^\d{4,14}$/,
  "A LinkedIn conversion ID is numeric.",
);

export const validatePinterestTagId: Validator = pattern(
  /^\d{10,20}$/,
  "A Pinterest tag ID is a long number from Ads → Conversions.",
);

export const validateTikTokPixelId: Validator = pattern(
  /^[A-Z0-9]{12,40}$/,
  "A TikTok pixel ID is an upper-case alphanumeric code.",
);

export const validateUetTagId: Validator = pattern(
  /^\d{6,14}$/,
  "A Microsoft UET tag ID is numeric (Bing Ads → Conversion tracking).",
);

export const validateBingApiKey: Validator = pattern(
  /^[a-f0-9]{32}$/i,
  "The Bing Webmaster API key is 32 hexadecimal characters.",
);

export const validateMetaAccessToken: Validator = pattern(
  /^[A-Za-z0-9_-]{40,}$/,
  "Paste the Conversions API access token from Events Manager → Settings.",
);

export const validateTestEventCode: Validator = pattern(
  /^TEST\d{3,8}$/,
  "Test event codes look like TEST12345 (Events Manager → Test events).",
);

/** `https://` only, no credentials, no fragment. */
export const validateHttpsUrl: Validator = (value) => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return "Enter a full URL starting with https://.";
  }
  if (url.protocol !== "https:") return "The URL must start with https://.";
  if (url.username || url.password) return "The URL must not contain credentials.";
  if (url.hash) return "Remove the #fragment from the URL.";
  return null;
};

/** `sc-domain:example.com` or an https URL prefix property. */
export const validateGscProperty: Validator = (value) => {
  const v = value.trim();
  if (/^sc-domain:[a-z0-9.-]+\.[a-z]{2,}$/i.test(v)) return null;
  const urlError = validateHttpsUrl(v);
  return urlError
    ? "Enter the Search Console property: sc-domain:example.com or https://example.com/."
    : null;
};

/** Google service-account JSON: must parse and carry the two fields the JWT flow needs. */
export const validateServiceAccountJson: Validator = (value) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return "Paste the full service-account JSON key file.";
  }
  if (!parsed || typeof parsed !== "object") return "The JSON must be an object.";
  const p = parsed as Record<string, unknown>;
  if (typeof p.client_email !== "string" || !p.client_email.includes("@")) {
    return "The JSON is missing client_email.";
  }
  if (typeof p.private_key !== "string" || !p.private_key.includes("BEGIN PRIVATE KEY")) {
    return "The JSON is missing private_key.";
  }
  return null;
};

/** ISO 3166-1 alpha-2 list, upper-cased, de-duplicated; invalid codes reported. */
export function parseRegionList(raw: string): { regions: string[]; error: string | null } {
  const seen = new Set<string>();
  const bad: string[] = [];
  for (const piece of raw.split(/[\s,;]+/)) {
    if (!piece) continue;
    const code = piece.toUpperCase();
    if (/^[A-Z]{2}$/.test(code)) seen.add(code);
    else bad.push(piece);
  }
  return {
    regions: [...seen],
    error: bad.length ? `Not a two-letter country code: ${bad.join(", ")}` : null,
  };
}
