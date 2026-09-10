import { getIntegrations } from "@/lib/data";
import type { Integration } from "@/lib/data/types";

/**
 * The ONE place that decides which third-party tag loads (CLAUDE.md §13). Reads the enabled
 * rows of `integrations`; in Phase 1 every provider renders nothing. Phase 6 fills each case
 * with the provider's snippet, gated by consent and `loadsInRegions`. Never throws when the
 * database is absent — the data layer falls back to the (all-disabled) seed.
 */
export async function Integrations() {
  let enabled: Integration[] = [];
  try {
    enabled = await getIntegrations();
  } catch {
    return null;
  }
  if (enabled.length === 0) return null;

  return (
    <>
      {enabled.map((integration) => (
        <IntegrationTag key={integration.id} integration={integration} />
      ))}
    </>
  );
}

function IntegrationTag({ integration }: { integration: Integration }) {
  switch (integration.provider) {
    case "google_search_console":
      return null; // Phase 6: verification meta comes from `verification_tags`; API lives server-side.
    case "bing_webmaster":
      return null; // Phase 6: IndexNow key + verification.
    case "meta_pixel":
      return null; // Phase 6: fbq init + PageView, after consent in UK/EU.
    case "meta_capi":
      return null; // Server-side only — never renders a tag.
    case "google_tag":
      return null; // Phase 6: gtag.js with the Google tag ID.
    case "google_ads":
      return null; // Phase 6: Ads conversion tag.
    case "ga4":
      return null; // Phase 6: optional GA4 config on the shared gtag loader.
    case "linkedin_insight":
      return null; // Phase 6.
    case "pinterest_tag":
      return null; // Phase 6.
    case "tiktok_pixel":
      return null; // Phase 6.
    case "microsoft_uet":
      return null; // Phase 6.
    case "gtm":
      return null; // Phase 6: GTM container, consent-gated.
    case "custom_head":
      return null; // Phase 6: sanitised custom head script.
    case "custom_body":
      return null; // Phase 6: sanitised custom body script.
    default:
      return null;
  }
}
