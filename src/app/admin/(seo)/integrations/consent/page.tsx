import type { Metadata } from "next";
import { INTEGRATIONS_NAV } from "@/components/admin/integrations/sub-nav";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { getAdminSession } from "@/lib/admin/auth";
import { getConsentConfig } from "@/lib/consent/config";
import { getConsentSummary } from "@/lib/consent/log";
import { PROVIDERS } from "@/lib/integrations/providers";
import { listIntegrations } from "@/lib/integrations/store";

/**
 * `/admin/integrations/consent` — the banner's wording, the countries it applies in, and what
 * visitors have chosen (CLAUDE.md §13E). If no advertising tag is enabled, no banner is shown
 * at all: this page says so rather than pretending otherwise.
 */
export const metadata: Metadata = { title: "Consent" };
export const dynamic = "force-dynamic";

function percent(part: number, total: number): string {
  return total === 0 ? "—" : `${Math.round((part / total) * 100)}%`;
}

export default async function ConsentPage() {
  const db = getDb();
  const [session, config, integrations, summary] = await Promise.all([
    getAdminSession(),
    getConsentConfig(),
    listIntegrations(),
    getConsentSummary(30),
  ]);
  const canEdit = session?.adminUser.role === "owner" && Boolean(db ?? session.bypass);
  const thirdParty = integrations.filter(
    (i) => i.isEnabled && PROVIDERS[i.provider].rendersTag && PROVIDERS[i.provider].thirdParty,
  );

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Consent"
        description="Third-party advertising tags are the one thing that legally needs consent from visitors in the UK, the EU/EEA and Switzerland. The site's own visitor statistics are cookieless, disclosed in the privacy policy and never gated."
      />
      <SubNav
        items={INTEGRATIONS_NAV}
        current="/admin/integrations/consent"
        label="Integration sections"
      />
      {!db ? <OfflineNote /> : null}

      <Panel
        className="mb-6"
        title={thirdParty.length === 0 ? "No banner is being shown" : "The banner is in use"}
      >
        <p className="max-w-prose text-sm text-muted-foreground">
          {thirdParty.length === 0 ? (
            <>
              No advertising tag is enabled, so visitors see no consent banner anywhere in the
              world. It appears by itself the moment you switch one on under Connections.
            </>
          ) : (
            <>
              {thirdParty.map((i) => PROVIDERS[i.provider].label).join(", ")}{" "}
              {thirdParty.length === 1 ? "is" : "are"} enabled, so visitors in the countries listed
              below are asked before any of it loads. Everyone else gets the tags immediately, with
              the privacy policy linked in the footer.
            </>
          )}
        </p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ActionForm
          action="/api/admin/integrations/consent"
          method="PATCH"
          submitLabel="Save consent settings"
          disabled={!canEdit}
          successMessage="Saved. Visitors see the new wording on their next page view."
        >
          <Panel title="Banner wording" bodyClassName="flex flex-col gap-4">
            <Field label="Heading" htmlFor="title">
              <Input id="title" name="title" defaultValue={config.title} required />
            </Field>
            <Field
              label="Explanation"
              htmlFor="body"
              hint="Say plainly what the tags do and who receives the data. No pre-ticked boxes, no “by continuing you agree”."
            >
              <Textarea id="body" name="body" rows={6} defaultValue={config.body} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Accept button" htmlFor="acceptLabel">
                <Input id="acceptLabel" name="acceptLabel" defaultValue={config.acceptLabel} />
              </Field>
              <Field
                label="Reject button"
                htmlFor="rejectLabel"
                hint="Both buttons are shown with equal weight."
              >
                <Input id="rejectLabel" name="rejectLabel" defaultValue={config.rejectLabel} />
              </Field>
            </div>
            <Field
              label="Policy version"
              htmlFor="policyVersion"
              hint="Change this when the wording or the tags change: everyone is asked again, and old choices stop counting."
            >
              <Input
                id="policyVersion"
                name="policyVersion"
                defaultValue={config.policyVersion}
                required
              />
            </Field>
            <Field
              label="Countries that require consent"
              htmlFor="consentRegions"
              hint="Two-letter country codes, comma separated. The default is the UK, the EU/EEA, Switzerland and the Crown dependencies."
            >
              <Textarea
                id="consentRegions"
                name="consentRegions"
                rows={3}
                defaultValue={config.consentRegions.join(", ")}
              />
            </Field>
            <CheckboxField
              name="unknownRegionRequiresConsent"
              label="Ask when the visitor's country is unknown"
              defaultChecked={config.unknownRegionRequiresConsent}
              hint="Safer: a visitor behind a VPN or a stripped header is treated as if they were in the EU."
            />
          </Panel>
        </ActionForm>

        <div className="flex flex-col gap-4">
          <Panel title="Choices in the last 30 days">
            {summary.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                No choices recorded yet — either no banner has been shown, or no visitor from a
                consent country has answered it.
              </p>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="font-serif text-2xl">{summary.total}</p>
                    <p className="text-xs text-muted-foreground">answers</p>
                  </div>
                  <div>
                    <p className="font-serif text-2xl text-success">{summary.accepted}</p>
                    <p className="text-xs text-muted-foreground">
                      accepted ({percent(summary.accepted, summary.total)})
                    </p>
                  </div>
                  <div>
                    <p className="font-serif text-2xl">{summary.rejected}</p>
                    <p className="text-xs text-muted-foreground">
                      rejected ({percent(summary.rejected, summary.total)})
                    </p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th className="py-1 font-medium">Country</th>
                      <th className="py-1 font-medium">Accepted</th>
                      <th className="py-1 font-medium">Rejected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byRegion.map((row) => (
                      <tr key={row.region} className="border-t border-border/70">
                        <td className="py-1.5">{row.region}</td>
                        <td className="py-1.5">{row.accepted}</td>
                        <td className="py-1.5">{row.rejected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Panel>

          <Panel title="How a visitor changes their mind">
            <p className="text-sm text-muted-foreground">
              Every page footer carries a “Manage consent” link. Clicking it reopens the banner
              wherever the visitor is, so a choice is never final. Choices are stored for six
              months, or until you change the policy version above.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
