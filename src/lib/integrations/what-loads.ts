/**
 * THE decision function (CLAUDE.md §13C/E): given the visitor's region, their consent state and
 * the enabled integrations, which tags load right now and why. Pure and isomorphic — used by the
 * `<Integrations />` loader in the browser, by the consent endpoint and by the admin "what's
 * loading right now" preview, so every place agrees. Unit-tested as a matrix in
 * `tests/integrations/what-loads.test.ts`.
 *
 * Rules, in order, per enabled provider that renders a tag:
 *   1. server-only / search providers never render → `not_a_tag`
 *   2. `loadsInRegions` non-empty and region not listed (or unknown) → `region_excluded`
 *   3. first-party (not `thirdParty`) tags load → `first_party`
 *   4. region requires consent (config list, unknown region per config) and consent is not
 *      granted → `consent_required` (unknown) / `consent_denied` (denied)
 *   5. otherwise → `loads`
 * Dependencies: Google Ads and GA4 need the Google tag loader (or GTM); a missing loader is
 * reported as `missing_dependency` so the admin can see why nothing fires.
 */
import type { IntegrationProvider } from "@/db/schema/integrations";
import type { ConsentState } from "@/lib/consent/cookie";
import {
  normalizeRegion,
  regionRequiresConsent,
  type ConsentRegionPolicy,
} from "@/lib/consent/regions";
import { PROVIDERS } from "./providers";

/** The minimum an integration row must expose to be decided on (public projection suffices). */
export interface LoadableIntegration {
  provider: IntegrationProvider;
  isEnabled: boolean;
  loadsInRegions: readonly string[];
  config: Record<string, string | number | boolean | null>;
}

export type LoadReason =
  | "loads"
  | "first_party"
  | "disabled"
  | "not_a_tag"
  | "region_excluded"
  | "consent_required"
  | "consent_denied"
  | "missing_dependency";

export interface LoadDecision {
  provider: IntegrationProvider;
  loads: boolean;
  reason: LoadReason;
  /** True when the tag is third-party and would need consent in a consent region. */
  thirdParty: boolean;
}

export interface WhatLoadsInput {
  region: string | null | undefined;
  consent: ConsentState | "unknown";
  integrations: readonly LoadableIntegration[];
  policy?: ConsentRegionPolicy;
}

export interface WhatLoadsResult {
  region: string | null;
  requiresConsent: boolean;
  consent: ConsentState | "unknown";
  decisions: LoadDecision[];
  /** Providers that load right now. */
  loading: IntegrationProvider[];
  /** True when at least one enabled third-party tag exists — the banner's precondition. */
  hasThirdPartyTags: boolean;
  /** The banner shows only when a third-party tag is enabled, consent is required and unknown. */
  showBanner: boolean;
}

const NEEDS_GOOGLE_LOADER = new Set<IntegrationProvider>(["google_ads", "ga4"]);

export function whatLoads(input: WhatLoadsInput): WhatLoadsResult {
  const region = normalizeRegion(input.region);
  const requiresConsent = regionRequiresConsent(region, input.policy);
  const enabled = input.integrations.filter((i) => i.isEnabled);
  const enabledSet = new Set(enabled.map((i) => i.provider));
  const hasGoogleLoader = enabledSet.has("google_tag") || enabledSet.has("gtm");

  const decisions: LoadDecision[] = input.integrations.map((integration) => {
    const def = PROVIDERS[integration.provider];
    const base = { provider: integration.provider, thirdParty: def.thirdParty };
    if (!integration.isEnabled) return { ...base, loads: false, reason: "disabled" };
    if (!def.rendersTag) return { ...base, loads: false, reason: "not_a_tag" };
    if (integration.loadsInRegions.length > 0) {
      const allowed = integration.loadsInRegions.map((r) => r.toUpperCase());
      if (!region || !allowed.includes(region)) {
        return { ...base, loads: false, reason: "region_excluded" };
      }
    }
    if (!def.thirdParty) return { ...base, loads: true, reason: "first_party" };
    if (requiresConsent && input.consent !== "granted") {
      return {
        ...base,
        loads: false,
        reason: input.consent === "denied" ? "consent_denied" : "consent_required",
      };
    }
    if (NEEDS_GOOGLE_LOADER.has(integration.provider) && !hasGoogleLoader) {
      return { ...base, loads: false, reason: "missing_dependency" };
    }
    return { ...base, loads: true, reason: "loads" };
  });

  const hasThirdPartyTags = enabled.some(
    (i) => PROVIDERS[i.provider].rendersTag && PROVIDERS[i.provider].thirdParty,
  );
  return {
    region,
    requiresConsent,
    consent: input.consent,
    decisions,
    loading: decisions.filter((d) => d.loads).map((d) => d.provider),
    hasThirdPartyTags,
    showBanner: hasThirdPartyTags && requiresConsent && input.consent === "unknown",
  };
}

/** Plain-language reason for the admin preview and the CAPI log. */
export const LOAD_REASON_TEXT: Record<LoadReason, string> = {
  loads: "Loads",
  first_party: "Loads (first-party, not consent-gated)",
  disabled: "Disabled",
  not_a_tag: "Server-side only — nothing loads in the browser",
  region_excluded: "Not loading: visitor's country is outside this tag's region list",
  consent_required: "Waiting for consent",
  consent_denied: "Not loading: visitor rejected advertising cookies",
  missing_dependency: "Not loading: enable the Google tag (or Tag Manager) first",
};
