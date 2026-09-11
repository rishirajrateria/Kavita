/**
 * Provider registry (CLAUDE.md §13; Phase 6). One definition per `integrations.provider`:
 * fields (which are secret, how each validates), whether the provider renders a browser tag,
 * whether that tag is third-party (and so waits for consent in consent regions), and the
 * owner-facing notes the admin card shows. The store encrypts every field marked `secret`;
 * the `<Integrations />` component and the admin preview read `rendersTag`/`thirdParty`.
 * Test-connection functions live in `./test-connection.ts` (network); this file is pure.
 */
import { INTEGRATION_PROVIDERS, type IntegrationProvider } from "@/db/schema/integrations";
import {
  validateBingApiKey,
  validateGa4MeasurementId,
  validateGoogleAdsConversionId,
  validateGoogleAdsLabel,
  validateGoogleTagId,
  validateGscProperty,
  validateGtmContainerId,
  validateHttpsUrl,
  validateLinkedInConversionId,
  validateLinkedInPartnerId,
  validateMetaAccessToken,
  validateMetaDomainVerification,
  validateMetaPixelId,
  validatePinterestTagId,
  validateServiceAccountJson,
  validateTestEventCode,
  validateTikTokPixelId,
  validateUetTagId,
  type Validator,
} from "./validators";

export type { IntegrationProvider };
export { INTEGRATION_PROVIDERS };

export interface ProviderField {
  key: string;
  label: string;
  /** Encrypted at rest; never sent to the browser; blank on update keeps the stored value. */
  secret?: boolean;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  validate?: Validator;
}

export type ProviderCategory = "search" | "advertising" | "analytics" | "server" | "custom";

export interface ProviderDefinition {
  provider: IntegrationProvider;
  label: string;
  category: ProviderCategory;
  description: string;
  fields: ProviderField[];
  /** Emits a `<script>`/`<meta>` in the public page (subject to region + consent). */
  rendersTag: boolean;
  /** Sets third-party cookies / sends data to an ad platform → consent-gated in consent regions. */
  thirdParty: boolean;
  /** Receives conversion events (browser fan-out or CAPI). */
  receivesEvents: boolean;
  /** Owner-facing note shown on the card. Plain language, honest about implications. */
  notes: string;
}

const tag = (
  provider: IntegrationProvider,
  label: string,
  category: ProviderCategory,
  description: string,
  fields: ProviderField[],
  notes: string,
  extra: Partial<ProviderDefinition> = {},
): ProviderDefinition => ({
  provider,
  label,
  category,
  description,
  fields,
  rendersTag: true,
  thirdParty: true,
  receivesEvents: true,
  notes,
  ...extra,
});

export const PROVIDERS: Record<IntegrationProvider, ProviderDefinition> = {
  google_search_console: tag(
    "google_search_console",
    "Google Search Console",
    "search",
    "Verifies the site with Google and pulls impressions, clicks and positions per page into the Indexing dashboard.",
    [
      {
        key: "property",
        label: "Property",
        required: true,
        placeholder: "sc-domain:example.com",
        hint: "Domain property (sc-domain:) or URL-prefix property exactly as Search Console shows it.",
        validate: validateGscProperty,
      },
      {
        key: "serviceAccountJson",
        label: "Service-account JSON key",
        secret: true,
        multiline: true,
        hint: "Create a service account in Google Cloud, enable the Search Console API, add its email as a Search Console user, then paste the JSON key here. Stored encrypted.",
        validate: validateServiceAccountJson,
      },
    ],
    "Verification itself is a meta tag or HTML file — add it in the Verification section below. This connection only reads performance data; it never changes anything in Google.",
    { rendersTag: false, thirdParty: false, receivesEvents: false },
  ),
  bing_webmaster: tag(
    "bing_webmaster",
    "Bing Webmaster Tools",
    "search",
    "Verifies the site with Bing and reads page and query statistics. Bing's index also feeds ChatGPT search.",
    [
      {
        key: "siteUrl",
        label: "Site URL",
        required: true,
        placeholder: "https://example.com/",
        validate: validateHttpsUrl,
      },
      {
        key: "apiKey",
        label: "API key",
        secret: true,
        hint: "Bing Webmaster Tools → Settings → API access. Stored encrypted.",
        validate: validateBingApiKey,
      },
    ],
    "IndexNow pings use the INDEXNOW_KEY environment variable, not this key. Add the BingSiteAuth.xml file or meta tag in the Verification section.",
    { rendersTag: false, thirdParty: false, receivesEvents: false },
  ),
  meta_pixel: tag(
    "meta_pixel",
    "Meta Pixel",
    "advertising",
    "Loads the Facebook/Instagram pixel with PageView, and forwards booking and contact events with an event ID that the Conversions API de-duplicates against.",
    [
      {
        key: "pixelId",
        label: "Pixel ID",
        required: true,
        placeholder: "123456789012345",
        validate: validateMetaPixelId,
      },
      {
        key: "domainVerification",
        label: "Domain verification code",
        placeholder: "content value of the facebook-domain-verification tag",
        hint: "Business Settings → Brand Safety → Domains. Optional; needed for aggregated event measurement.",
        validate: validateMetaDomainVerification,
      },
    ],
    "Third-party cookie. Waits for consent in the UK, EU/EEA and Switzerland. Pair it with the Conversions API so iOS conversions are not lost.",
  ),
  meta_capi: tag(
    "meta_capi",
    "Meta Conversions API",
    "server",
    "Sends booking_completed, contact_submitted and whatsapp_clicked from the server with hashed contact data, de-duplicated against the browser pixel by event ID.",
    [
      {
        key: "pixelId",
        label: "Pixel ID",
        placeholder: "defaults to the Meta Pixel ID",
        validate: validateMetaPixelId,
      },
      {
        key: "accessToken",
        label: "Access token",
        secret: true,
        required: true,
        hint: "Events Manager → Settings → Conversions API → Generate access token. Stored encrypted.",
        validate: validateMetaAccessToken,
      },
      {
        key: "testEventCode",
        label: "Test event code",
        placeholder: "TEST12345",
        hint: "Set while checking events in Events Manager → Test events; clear it for production.",
        validate: validateTestEventCode,
      },
    ],
    "Server-side only: nothing loads in the browser. Emails and phone numbers are SHA-256 hashed before they leave the server; every send is logged (redacted) in the CAPI log.",
    { rendersTag: false, thirdParty: false },
  ),
  google_tag: tag(
    "google_tag",
    "Google tag (gtag.js)",
    "advertising",
    "The shared Google tag loader. Google Ads and GA4 configure themselves on top of it.",
    [
      {
        key: "tagId",
        label: "Tag ID",
        required: true,
        placeholder: "GT-XXXXXXX or AW-XXXXXXX",
        validate: validateGoogleTagId,
      },
    ],
    "Loads once; Google Ads conversions and GA4 reuse it. Waits for consent in consent regions; elsewhere it loads per your region setting.",
    { receivesEvents: false },
  ),
  google_ads: tag(
    "google_ads",
    "Google Ads conversions",
    "advertising",
    "Reports bookings and contacts as Google Ads conversions.",
    [
      {
        key: "conversionId",
        label: "Conversion ID",
        required: true,
        placeholder: "AW-123456789",
        validate: validateGoogleAdsConversionId,
      },
      {
        key: "bookingLabel",
        label: "Booking conversion label",
        placeholder: "AbCdEfGhIj",
        hint: "Ads → Goals → Conversions → the booking action → Tag setup.",
        validate: validateGoogleAdsLabel,
      },
      {
        key: "contactLabel",
        label: "Contact conversion label",
        validate: validateGoogleAdsLabel,
      },
    ],
    "Needs the Google tag (or Tag Manager) to be enabled as well. Labels map to events in the Event mapping table.",
  ),
  ga4: tag(
    "ga4",
    "Google Analytics 4",
    "analytics",
    "Optional add-on. The first-party dashboard stays the primary analytics; GA4 duplicates page views and conversions into Google.",
    [
      {
        key: "measurementId",
        label: "Measurement ID",
        required: true,
        placeholder: "G-XXXXXXXXXX",
        validate: validateGa4MeasurementId,
      },
    ],
    "Never a replacement for the built-in analytics. Needs the Google tag enabled. Waits for consent in consent regions.",
  ),
  linkedin_insight: tag(
    "linkedin_insight",
    "LinkedIn Insight Tag",
    "advertising",
    "Audience and conversion tracking for LinkedIn campaigns.",
    [
      {
        key: "partnerId",
        label: "Partner ID",
        required: true,
        placeholder: "1234567",
        validate: validateLinkedInPartnerId,
      },
      {
        key: "conversionId",
        label: "Booking conversion ID",
        validate: validateLinkedInConversionId,
      },
    ],
    "Third-party cookie; consent-gated in consent regions.",
  ),
  pinterest_tag: tag(
    "pinterest_tag",
    "Pinterest Tag",
    "advertising",
    "Pinterest conversion tracking.",
    [
      {
        key: "tagId",
        label: "Tag ID",
        required: true,
        placeholder: "2612345678901",
        validate: validatePinterestTagId,
      },
    ],
    "Third-party cookie; consent-gated in consent regions. Pinterest site claim uses the Verification section.",
  ),
  tiktok_pixel: tag(
    "tiktok_pixel",
    "TikTok Pixel",
    "advertising",
    "TikTok conversion tracking.",
    [
      {
        key: "pixelId",
        label: "Pixel ID",
        required: true,
        placeholder: "C1A2B3C4D5E6F7G8H9I0",
        validate: validateTikTokPixelId,
      },
    ],
    "Third-party cookie; consent-gated in consent regions.",
  ),
  microsoft_uet: tag(
    "microsoft_uet",
    "Microsoft Advertising UET",
    "advertising",
    "Universal Event Tracking for Bing/Microsoft Ads.",
    [
      {
        key: "tagId",
        label: "UET tag ID",
        required: true,
        placeholder: "12345678",
        validate: validateUetTagId,
      },
    ],
    "Third-party cookie; consent-gated in consent regions.",
  ),
  gtm: tag(
    "gtm",
    "Google Tag Manager",
    "custom",
    "Escape hatch for anything not listed. Everything inside the container is your responsibility.",
    [
      {
        key: "containerId",
        label: "Container ID",
        required: true,
        placeholder: "GTM-XXXXXXX",
        validate: validateGtmContainerId,
      },
    ],
    "Consent-gated in consent regions like any third-party tag. Tags added inside GTM are not listed on the privacy page automatically — describe them there yourself.",
    { receivesEvents: false },
  ),
  custom_head: tag(
    "custom_head",
    "Custom head HTML",
    "custom",
    "Raw HTML injected into <head>. Passed through a sanitiser that strips event handlers and disallowed elements.",
    [
      {
        key: "html",
        label: "HTML",
        required: true,
        multiline: true,
        placeholder: "<script>…</script>",
      },
    ],
    "Treated as a third-party tag: consent-gated in consent regions. Only <script>, <meta>, <link>, <style> and <noscript> survive the sanitiser.",
    { receivesEvents: false },
  ),
  custom_body: tag(
    "custom_body",
    "Custom body HTML",
    "custom",
    "Raw HTML injected at the end of <body>. Same sanitiser as the head script.",
    [
      {
        key: "html",
        label: "HTML",
        required: true,
        multiline: true,
        placeholder: "<script>…</script>",
      },
    ],
    "Treated as a third-party tag: consent-gated in consent regions.",
    { receivesEvents: false },
  ),
};

/** Card order in the admin: search first, then the ad pixels, then the escape hatches. */
export const PROVIDER_ORDER: readonly IntegrationProvider[] = [
  "google_search_console",
  "bing_webmaster",
  "meta_pixel",
  "meta_capi",
  "google_tag",
  "google_ads",
  "ga4",
  "linkedin_insight",
  "pinterest_tag",
  "tiktok_pixel",
  "microsoft_uet",
  "gtm",
  "custom_head",
  "custom_body",
];

/** Human labels, also used by the privacy policy's generated pixel section. */
export const PROVIDER_LABELS: Record<IntegrationProvider, string> = Object.fromEntries(
  INTEGRATION_PROVIDERS.map((p) => [p, PROVIDERS[p].label]),
) as Record<IntegrationProvider, string>;

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return (INTEGRATION_PROVIDERS as readonly string[]).includes(value);
}

export function secretFieldKeys(provider: IntegrationProvider): string[] {
  return PROVIDERS[provider].fields.filter((f) => f.secret).map((f) => f.key);
}

/**
 * Validate a config against the provider's fields. `presentSecrets` lists secret keys that are
 * already stored, so a blank secret on update is not a "required" failure.
 */
export function validateProviderConfig(
  provider: IntegrationProvider,
  config: Record<string, unknown>,
  presentSecrets: readonly string[] = [],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of PROVIDERS[provider].fields) {
    const raw = config[field.key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      const stored = field.secret && presentSecrets.includes(field.key);
      if (field.required && !stored) errors[field.key] = `${field.label} is required.`;
      continue;
    }
    const message = field.validate?.(value);
    if (message) errors[field.key] = message;
  }
  return errors;
}
