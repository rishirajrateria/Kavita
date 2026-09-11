/**
 * The `whatLoads()` decision matrix (CLAUDE.md §13C/E). This is the one function that decides
 * whether a third-party script runs in a visitor's browser, so it is tested as a full matrix:
 * every region class × every consent state × enabled/disabled, plus the region allow-list, the
 * Google-loader dependency and the banner precondition.
 */
import { check, equal } from "../seo-plumbing/_assert";
import type { ConsentState } from "@/lib/consent/cookie";
import { DEFAULT_CONSENT_REGIONS, regionRequiresConsent } from "@/lib/consent/regions";
import { whatLoads, type LoadableIntegration } from "@/lib/integrations/what-loads";

function integration(
  provider: LoadableIntegration["provider"],
  overrides: Partial<LoadableIntegration> = {},
): LoadableIntegration {
  return {
    provider,
    isEnabled: true,
    loadsInRegions: [],
    config: {},
    ...overrides,
  };
}

export function run() {
  // ---- regions -------------------------------------------------------------------------
  check(regionRequiresConsent("GB"), "regions: the UK requires consent");
  check(regionRequiresConsent("DE"), "regions: Germany requires consent");
  check(regionRequiresConsent("CH"), "regions: Switzerland requires consent");
  check(!regionRequiresConsent("IN"), "regions: India does not require consent");
  check(!regionRequiresConsent("US"), "regions: the United States does not require consent");
  check(regionRequiresConsent(null), "regions: an unknown country is treated as consent-required");
  check(DEFAULT_CONSENT_REGIONS.includes("NO"), "regions: EEA members are included");

  // ---- nothing enabled -----------------------------------------------------------------
  const none = whatLoads({
    region: "GB",
    consent: "unknown",
    integrations: [integration("meta_pixel", { isEnabled: false })],
  });
  equal(none.loading.length, 0, "whatLoads: a disabled provider loads nothing");
  check(!none.hasThirdPartyTags, "whatLoads: no enabled third-party tag");
  check(!none.showBanner, "whatLoads: no banner when no pixel is enabled (§13E)");
  equal(none.decisions[0]?.reason, "disabled", "whatLoads: reason is `disabled`");

  // ---- the matrix: one third-party pixel, every region class × consent state -------------
  const regions: { region: string | null; consentRegion: boolean; label: string }[] = [
    { region: "IN", consentRegion: false, label: "India" },
    { region: "US", consentRegion: false, label: "United States" },
    { region: "AE", consentRegion: false, label: "UAE" },
    { region: "GB", consentRegion: true, label: "United Kingdom" },
    { region: "DE", consentRegion: true, label: "Germany" },
    { region: "CH", consentRegion: true, label: "Switzerland" },
    { region: null, consentRegion: true, label: "unknown country" },
  ];
  const states: (ConsentState | "unknown")[] = ["unknown", "granted", "denied"];

  for (const { region, consentRegion, label } of regions) {
    for (const consent of states) {
      const result = whatLoads({
        region,
        consent,
        integrations: [integration("meta_pixel", { config: { pixelId: "123" } })],
      });
      const expected = consentRegion ? consent === "granted" : true;
      equal(
        result.loading.includes("meta_pixel"),
        expected,
        `whatLoads: Meta Pixel in ${label} with consent=${consent}`,
      );
      const decision = result.decisions[0];
      if (expected) {
        equal(decision?.reason, "loads", `whatLoads: reason in ${label}/${consent}`);
      } else {
        equal(
          decision?.reason,
          consent === "denied" ? "consent_denied" : "consent_required",
          `whatLoads: reason in ${label}/${consent}`,
        );
      }
      equal(
        result.showBanner,
        consentRegion && consent === "unknown",
        `whatLoads: banner in ${label} with consent=${consent}`,
      );
    }
  }

  // ---- server-only and search providers never render a tag -------------------------------
  const serverOnly = whatLoads({
    region: "IN",
    consent: "granted",
    integrations: [
      integration("meta_capi", { config: { accessToken: "x" } }),
      integration("google_search_console"),
      integration("bing_webmaster"),
    ],
  });
  equal(serverOnly.loading.length, 0, "whatLoads: server/search providers render no tag");
  for (const decision of serverOnly.decisions) {
    equal(decision.reason, "not_a_tag", `whatLoads: ${decision.provider} is not a tag`);
  }
  check(
    !serverOnly.hasThirdPartyTags,
    "whatLoads: the Conversions API alone never triggers a banner",
  );

  // ---- the region allow-list narrows further ---------------------------------------------
  const restricted = [integration("meta_pixel", { loadsInRegions: ["IN", "AE"] })];
  equal(
    whatLoads({ region: "IN", consent: "unknown", integrations: restricted }).loading.length,
    1,
    "whatLoads: listed country loads",
  );
  const excluded = whatLoads({ region: "US", consent: "granted", integrations: restricted });
  equal(excluded.loading.length, 0, "whatLoads: unlisted country is excluded");
  equal(excluded.decisions[0]?.reason, "region_excluded", "whatLoads: reason is region_excluded");
  equal(
    whatLoads({ region: null, consent: "granted", integrations: restricted }).decisions[0]?.reason,
    "region_excluded",
    "whatLoads: an unknown country cannot satisfy a region list",
  );

  // ---- the Google tag dependency ----------------------------------------------------------
  const adsAlone = whatLoads({
    region: "IN",
    consent: "unknown",
    integrations: [integration("google_ads", { config: { conversionId: "AW-1" } })],
  });
  equal(adsAlone.loading.length, 0, "whatLoads: Google Ads without a loader does not load");
  equal(
    adsAlone.decisions[0]?.reason,
    "missing_dependency",
    "whatLoads: the reason names the missing loader",
  );
  const adsWithTag = whatLoads({
    region: "IN",
    consent: "unknown",
    integrations: [
      integration("google_tag", { config: { tagId: "GT-1" } }),
      integration("google_ads", { config: { conversionId: "AW-1" } }),
    ],
  });
  equal(adsWithTag.loading.length, 2, "whatLoads: Google Ads loads once the Google tag is on");

  // ---- a mixed, realistic setup in a consent region ---------------------------------------
  const mixed = [
    integration("google_tag", { config: { tagId: "GT-1" } }),
    integration("ga4", { config: { measurementId: "G-1" } }),
    integration("meta_pixel", { config: { pixelId: "123" } }),
    integration("meta_capi", { config: { accessToken: "t" } }),
    integration("tiktok_pixel", { isEnabled: false }),
  ];
  const beforeChoice = whatLoads({ region: "GB", consent: "unknown", integrations: mixed });
  equal(beforeChoice.loading.length, 0, "whatLoads: nothing loads in the UK before a choice");
  check(beforeChoice.showBanner, "whatLoads: the banner is shown in the UK before a choice");
  const afterAccept = whatLoads({ region: "GB", consent: "granted", integrations: mixed });
  equal(afterAccept.loading.length, 3, "whatLoads: three tags load in the UK after accepting");
  check(!afterAccept.showBanner, "whatLoads: the banner closes once a choice exists");
  const afterReject = whatLoads({ region: "GB", consent: "denied", integrations: mixed });
  equal(afterReject.loading.length, 0, "whatLoads: rejection keeps everything off");

  // ---- an admin-shrunk consent list --------------------------------------------------------
  const custom = whatLoads({
    region: "GB",
    consent: "unknown",
    integrations: [integration("meta_pixel", { config: { pixelId: "1" } })],
    policy: { consentRegions: ["DE"], unknownRegionRequiresConsent: false },
  });
  equal(custom.loading.length, 1, "whatLoads: a shrunk consent list is honoured");
  check(!custom.showBanner, "whatLoads: no banner outside the configured consent list");
}
