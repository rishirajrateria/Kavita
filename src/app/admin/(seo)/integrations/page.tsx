import type { Metadata } from "next";
import { ProviderCard } from "@/components/admin/integrations/provider-card";
import { INTEGRATIONS_NAV } from "@/components/admin/integrations/sub-nav";
import { PageHeader } from "@/components/admin/manage/page-header";
import { OfflineNote, Panel } from "@/components/admin/manage/panel";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { getDb } from "@/db";
import { getAdminSession } from "@/lib/admin/auth";
import { getConsentConfig } from "@/lib/consent/config";
import { isSecretEncryptionConfigured } from "@/lib/crypto/secrets";
import { PROVIDERS, PROVIDER_ORDER } from "@/lib/integrations/providers";
import { listIntegrations } from "@/lib/integrations/store";
import { whatLoads } from "@/lib/integrations/what-loads";

/**
 * `/admin/integrations` — one card per external service (CLAUDE.md §13). Nothing here is
 * hardcoded in a layout or component: every tag the public site loads comes from these rows,
 * and each is off until an ID is entered.
 */
export const metadata: Metadata = { title: "Integrations" };
export const dynamic = "force-dynamic";

const CATEGORY_TITLE = {
  search: "Search engines",
  advertising: "Advertising pixels",
  analytics: "Analytics add-ons",
  server: "Server-side",
  custom: "Escape hatches",
} as const;

export default async function IntegrationsPage() {
  const db = getDb();
  const [session, integrations, config] = await Promise.all([
    getAdminSession(),
    listIntegrations(),
    getConsentConfig(),
  ]);
  const canEdit = session?.adminUser.role === "owner" && Boolean(db ?? session.bypass);
  const secretsReady = isSecretEncryptionConfigured();

  // A neutral baseline for the per-card badge: a visitor outside a consent region, no choice.
  const baseline = whatLoads({
    region: "IN",
    consent: "unknown",
    integrations,
    policy: {
      consentRegions: config.consentRegions,
      unknownRegionRequiresConsent: config.unknownRegionRequiresConsent,
    },
  });
  const decisions = new Map(baseline.decisions.map((d) => [d.provider, d]));
  const byProvider = new Map(integrations.map((i) => [i.provider, i]));

  const groups = new Map<string, typeof PROVIDER_ORDER>();
  for (const provider of PROVIDER_ORDER) {
    const category = PROVIDERS[provider].category;
    groups.set(category, [...(groups.get(category) ?? []), provider]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Connections"
        description="Every external service the site talks to. Each one is off until you enter its ID, credentials are encrypted before they are stored, and advertising tags still wait for consent in the UK, EU and Switzerland whatever is switched on here."
      />
      <SubNav items={INTEGRATIONS_NAV} current="/admin/integrations" label="Integration sections" />
      {!db ? <OfflineNote /> : null}
      {!secretsReady ? (
        <p
          role="status"
          className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning"
        >
          <code>DATA_ENCRYPTION_KEY</code> is not set, so access tokens and API keys cannot be
          stored. IDs (pixel IDs, tag IDs) still save; secrets will be refused.
        </p>
      ) : null}
      {session && session.adminUser.role !== "owner" ? (
        <p className="mb-4 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
          Only an owner can change integrations — these cards are read-only for your role.
        </p>
      ) : null}

      <div className="flex flex-col gap-10">
        {[...groups.entries()].map(([category, providers]) => (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="font-serif text-xl font-medium tracking-tight">
              {CATEGORY_TITLE[category as keyof typeof CATEGORY_TITLE]}
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {providers.map((provider) => {
                const integration = byProvider.get(provider);
                if (!integration) return null;
                return (
                  <ProviderCard
                    key={provider}
                    definition={PROVIDERS[provider]}
                    integration={integration}
                    decision={decisions.get(provider)}
                    canEdit={canEdit}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Panel
        className="mt-10"
        title="What the crawler toggles mean"
        description="Plain language, because the choice is a business decision."
      >
        <p className="max-w-prose text-sm text-muted-foreground">
          Connecting Search Console and Bing lets this dashboard read how the site performs in
          search; neither connection changes anything in Google or Bing. The advertising tags are
          different: they set third-party cookies and tell the platform which page a visitor opened.
          Turning one on in the UK, the EU/EEA or Switzerland shows visitors a consent banner —
          nothing loads until they accept.
        </p>
      </Panel>
    </>
  );
}
