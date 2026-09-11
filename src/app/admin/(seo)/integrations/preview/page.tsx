import type { Metadata } from "next";
import { INTEGRATIONS_NAV } from "@/components/admin/integrations/sub-nav";
import { PageHeader } from "@/components/admin/manage/page-header";
import { Panel } from "@/components/admin/manage/panel";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { Badge } from "@/components/ui/badge";
import { getConsentConfig } from "@/lib/consent/config";
import type { ConsentState } from "@/lib/consent/cookie";
import { PROVIDERS } from "@/lib/integrations/providers";
import { tagSnippet } from "@/lib/integrations/snippets";
import { listIntegrations } from "@/lib/integrations/store";
import { LOAD_REASON_TEXT, whatLoads } from "@/lib/integrations/what-loads";
import { cn } from "@/lib/utils";

/**
 * `/admin/integrations/preview` — "what's loading right now" (CLAUDE.md §13C). Runs the exact
 * same `whatLoads()` decision the public page runs, for a country and consent state you pick,
 * so there is never a question of what a visitor in Mumbai, London or New York actually gets.
 */
export const metadata: Metadata = { title: "What's loading" };
export const dynamic = "force-dynamic";

const SAMPLE_REGIONS = [
  { code: "IN", label: "India" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "SG", label: "Singapore" },
  { code: "", label: "Unknown country" },
];

const CONSENT_OPTIONS: { value: ConsentState | "unknown"; label: string }[] = [
  { value: "unknown", label: "Not yet answered" },
  { value: "granted", label: "Accepted" },
  { value: "denied", label: "Rejected" },
];

export default async function PreviewPage({
  searchParams,
}: PageProps<"/admin/integrations/preview">) {
  const params = await searchParams;
  const regionParam = typeof params.region === "string" ? params.region.toUpperCase() : "IN";
  const consentParam =
    params.consent === "granted" || params.consent === "denied" ? params.consent : "unknown";

  const [integrations, config] = await Promise.all([listIntegrations(), getConsentConfig()]);
  const result = whatLoads({
    region: regionParam || null,
    consent: consentParam,
    integrations,
    policy: {
      consentRegions: config.consentRegions,
      unknownRegionRequiresConsent: config.unknownRegionRequiresConsent,
    },
  });
  const byProvider = new Map(integrations.map((i) => [i.provider, i]));
  const link = (region: string, consent: string) =>
    `/admin/integrations/preview?region=${encodeURIComponent(region)}&consent=${consent}`;

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="What's loading right now"
        description="The same decision the live site makes, for any visitor you choose. If something is not firing in an ad platform, the reason is on this page."
      />
      <SubNav
        items={INTEGRATIONS_NAV}
        current="/admin/integrations/preview"
        label="Integration sections"
      />

      <div className="mb-6 flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Visitor&rsquo;s country
          </p>
          <ul className="flex flex-wrap gap-2">
            {SAMPLE_REGIONS.map((region) => (
              <li key={region.code || "unknown"}>
                <a
                  href={link(region.code, consentParam)}
                  aria-current={regionParam === region.code ? "true" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md border px-3 text-sm no-underline",
                    regionParam === region.code
                      ? "border-accent-border bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {region.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Their consent choice
          </p>
          <ul className="flex flex-wrap gap-2">
            {CONSENT_OPTIONS.map((option) => (
              <li key={option.value}>
                <a
                  href={link(regionParam, option.value)}
                  aria-current={consentParam === option.value ? "true" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md border px-3 text-sm no-underline",
                    consentParam === option.value
                      ? "border-accent-border bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Panel
        title="Verdict"
        description={
          result.requiresConsent
            ? "This country is on your consent list, so advertising tags wait for an answer."
            : "This country is not on your consent list, so advertising tags load straight away."
        }
      >
        <p className="text-sm">
          {result.loading.length === 0 ? (
            <>
              <strong>Nothing loads.</strong> No third-party script runs for this visitor.
            </>
          ) : (
            <>
              <strong>{result.loading.length} tag(s) load:</strong>{" "}
              {result.loading.map((p) => PROVIDERS[p].label).join(", ")}.
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Consent banner: {result.showBanner ? "shown" : "not shown"}
          {result.hasThirdPartyTags ? "" : " (no advertising tag is enabled at all)"}.
        </p>
      </Panel>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="py-2 pr-4 font-medium">Provider</th>
              <th className="py-2 pr-4 font-medium">Loads?</th>
              <th className="py-2 pr-4 font-medium">Why</th>
              <th className="py-2 pr-4 font-medium">Script</th>
            </tr>
          </thead>
          <tbody>
            {result.decisions.map((decision) => {
              const integration = byProvider.get(decision.provider);
              const snippet = integration
                ? tagSnippet(decision.provider, integration.config)
                : null;
              return (
                <tr key={decision.provider} className="border-t border-border/70 align-top">
                  <td className="py-2 pr-4">
                    <span className="font-medium">{PROVIDERS[decision.provider].label}</span>
                    {decision.thirdParty ? (
                      <Badge variant="outline" className="ml-2">
                        third-party
                      </Badge>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={decision.loads ? "default" : "outline"}>
                      {decision.loads ? "yes" : "no"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {LOAD_REASON_TEXT[decision.reason]}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">
                    {snippet
                      ? [
                          ...snippet.external.map((s) => s.src),
                          ...snippet.inline.map((s) => s.id),
                        ].join(", ")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
