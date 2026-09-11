import type { Metadata } from "next";
import { INTEGRATIONS_NAV } from "@/components/admin/integrations/sub-nav";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { getAdminSession } from "@/lib/admin/auth";
import { getCapiLog } from "@/lib/consent/log";
import { CONVERSION_EVENTS } from "@/lib/events";
import { EVENT_PROVIDERS, getEventMappings } from "@/lib/integrations/mappings";
import { PROVIDERS } from "@/lib/integrations/providers";
import { listIntegrations } from "@/lib/integrations/store";

/**
 * `/admin/integrations/events` — the mapping table (CLAUDE.md §13D). The site fires one internal
 * vocabulary; this screen decides what each platform is told. Adding a new ad platform is a new
 * mapping, never a change to the site's code.
 */
export const metadata: Metadata = { title: "Event mapping" };
export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  booking_started: "Booking started",
  booking_step: "Booking step completed",
  booking_completed: "Booking completed",
  contact_submitted: "Contact form sent",
  whatsapp_clicked: "WhatsApp clicked",
  call_clicked: "Phone number clicked",
  testimonial_submitted: "Experience submitted",
};

function paramsToLines(params: Record<string, string | number | boolean | null>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${String(value ?? "")}`)
    .join("\n");
}

export default async function EventMappingPage() {
  const db = getDb();
  const [session, mappings, integrations, capi] = await Promise.all([
    getAdminSession(),
    getEventMappings(),
    listIntegrations(),
    getCapiLog(15),
  ]);
  const canEdit = session?.adminUser.role === "owner" && Boolean(db ?? session.bypass);
  const enabled = new Set(integrations.filter((i) => i.isEnabled).map((i) => i.provider));

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Event mapping"
        description="The site fires seven conversion events. This table decides what each advertising platform is told when one happens — the platform's own event name, plus any parameters it expects. Values in braces, like {serviceSlug}, are filled in from the event as it fires."
      />
      <SubNav
        items={INTEGRATIONS_NAV}
        current="/admin/integrations/events"
        label="Integration sections"
      />
      {!db ? <OfflineNote /> : null}

      <Panel
        title="Internal vocabulary"
        description="Fired once by the site, then fanned out to every enabled destination."
      >
        <ul className="flex flex-wrap gap-2 text-xs">
          {CONVERSION_EVENTS.map((event) => (
            <li key={event}>
              <Badge variant="gold">{EVENT_LABEL[event] ?? event}</Badge>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-6 flex flex-col gap-6">
        {EVENT_PROVIDERS.map((provider) => {
          const rows = mappings.filter((m) => m.provider === provider);
          if (rows.length === 0) return null;
          return (
            <Panel
              key={provider}
              title={PROVIDERS[provider].label}
              description={
                enabled.has(provider)
                  ? "Enabled — these mappings are live."
                  : "Not enabled: nothing is sent until you switch this provider on under Connections."
              }
            >
              <div className="grid gap-5 lg:grid-cols-2">
                {rows.map((mapping) => {
                  const id = `${provider}-${mapping.internalEvent}`;
                  return (
                    <ActionForm
                      key={id}
                      action="/api/admin/integrations/mappings"
                      method="PATCH"
                      submitLabel="Save mapping"
                      size="sm"
                      disabled={!canEdit}
                      payload={{ provider, internalEvent: mapping.internalEvent }}
                      className="rounded-md border border-border/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {EVENT_LABEL[mapping.internalEvent] ?? mapping.internalEvent}
                        </span>
                        <Badge variant={mapping.custom ? "default" : "outline"}>
                          {mapping.custom ? "custom" : "default"}
                        </Badge>
                      </div>
                      <Field label="Platform event name" htmlFor={`${id}-event`}>
                        <Input
                          id={`${id}-event`}
                          name="providerEvent"
                          defaultValue={mapping.providerEvent}
                          autoComplete="off"
                        />
                      </Field>
                      <Field
                        label="Parameters"
                        htmlFor={`${id}-params`}
                        hint="One key=value per line."
                      >
                        <Textarea
                          id={`${id}-params`}
                          name="params"
                          rows={3}
                          defaultValue={paramsToLines(mapping.params)}
                        />
                      </Field>
                      <CheckboxField
                        name="isEnabled"
                        label="Send this event"
                        defaultChecked={mapping.isEnabled}
                      />
                    </ActionForm>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel
        className="mt-6"
        title="Conversions API log"
        description="Every server-side send to Meta, with contact details already hashed and removed. Kept so you can prove what was sent."
      >
        {capi.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing sent yet. The Conversions API sends bookings, contact messages and WhatsApp
            clicks once it is connected under Connections.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 pr-4 font-medium">Sent as</th>
                  <th className="py-2 pr-4 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {capi.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                      {row.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="py-2 pr-4">
                      {EVENT_LABEL[row.internalEvent] ?? row.internalEvent}
                    </td>
                    <td className="py-2 pr-4">
                      {row.providerEvent}
                      {row.testEventCode ? (
                        <Badge variant="outline" className="ml-2">
                          test
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={row.status === "sent" ? "text-success" : "text-error"}>
                        {row.status}
                        {row.httpStatus ? ` (${row.httpStatus})` : ""}
                      </span>
                      {row.errorMessage ? (
                        <span className="block text-xs text-muted-foreground">
                          {row.errorMessage}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
