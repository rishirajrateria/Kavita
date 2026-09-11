/**
 * Legal documents as typed data. `getLegalDocument()` lives in
 * `src/components/legal/context.ts` (server-only) because it reads settings and integrations.
 */
import type { IntegrationProvider } from "@/db/schema";
import { disclaimerDocument } from "./disclaimer";
import { privacyDocument } from "./privacy";
import { termsDocument } from "./terms";
import type { LegalContext, LegalDocument } from "./types";

export type { LegalBlock, LegalContext, LegalDocument, LegalSection } from "./types";
export { LEGAL_PLACEHOLDERS, toConfirm } from "./types";

export type LegalSlug = LegalDocument["slug"];

export const LEGAL_DOCUMENTS: Record<LegalSlug, (ctx: LegalContext) => LegalDocument> = {
  privacy: privacyDocument,
  terms: termsDocument,
  disclaimer: disclaimerDocument,
};

export const LEGAL_SLUGS = Object.keys(LEGAL_DOCUMENTS) as LegalSlug[];

/**
 * Human labels for the `integrations.provider` enum, used by the privacy policy's generated
 * "which pixels are active" section. Only the client-side tags that set cookies or receive page
 * data are listed; server-side and search-console connections are `null` (not a pixel).
 */
export const INTEGRATION_LABELS: Record<IntegrationProvider, string | null> = {
  google_search_console: null,
  bing_webmaster: null,
  meta_pixel: "Meta Pixel (Facebook and Instagram advertising)",
  meta_capi: null,
  google_tag: "Google tag (gtag.js)",
  google_ads: "Google Ads conversion tag",
  ga4: "Google Analytics 4",
  linkedin_insight: "LinkedIn Insight Tag",
  pinterest_tag: "Pinterest Tag",
  tiktok_pixel: "TikTok Pixel",
  microsoft_uet: "Microsoft Advertising UET tag",
  gtm: "Google Tag Manager container",
  custom_head: "Custom script (head)",
  custom_body: "Custom script (body)",
};
