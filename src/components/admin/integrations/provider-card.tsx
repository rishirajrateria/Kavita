/**
 * One provider card on `/admin/integrations` (CLAUDE.md §13). Server-rendered: the fields come
 * from the provider registry, the values from the public projection (a stored secret shows as
 * "•••• saved" and is never sent to the browser), and the two forms post to
 * `/api/admin/integrations` and `/api/admin/integrations/test`.
 *
 * Every card is off until an ID is entered — the save route refuses to enable a provider whose
 * required fields are empty.
 */
import { ActionForm } from "@/components/admin/manage/action-form";
import { CheckboxField, Field, Panel } from "@/components/admin/manage/panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderDefinition } from "@/lib/integrations/providers";
import type { PublicIntegration } from "@/lib/integrations/store";
import { LOAD_REASON_TEXT, type LoadDecision } from "@/lib/integrations/what-loads";

function formatDate(value: Date | null): string {
  if (!value) return "never";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

export function ProviderCard({
  definition,
  integration,
  decision,
  canEdit,
}: {
  definition: ProviderDefinition;
  integration: PublicIntegration;
  decision: LoadDecision | undefined;
  canEdit: boolean;
}) {
  const status = integration.lastTestStatus;
  return (
    <Panel
      title={definition.label}
      description={definition.description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={integration.isEnabled ? "default" : "outline"}>
            {integration.isEnabled ? "Enabled" : "Off"}
          </Badge>
          {decision && integration.isEnabled ? (
            <Badge variant={decision.loads ? "default" : "outline"}>
              {LOAD_REASON_TEXT[decision.reason]}
            </Badge>
          ) : null}
        </div>
      }
    >
      <ActionForm
        action="/api/admin/integrations"
        method="PATCH"
        submitLabel="Save"
        disabled={!canEdit}
        payload={{ provider: definition.provider }}
        successMessage="Saved. Reload a public page to see the change."
      >
        <div className="flex flex-col gap-4">
          {definition.fields.map((field) => {
            const inputId = `${definition.provider}-${field.key}`;
            const stored = integration.secretsSet[field.key];
            const value = field.secret ? "" : String(integration.config[field.key] ?? "");
            return (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={inputId}
                hint={
                  <>
                    {field.hint}
                    {field.secret ? (
                      <>
                        {field.hint ? " " : null}
                        {stored
                          ? "A value is saved and encrypted; leave blank to keep it."
                          : "Stored encrypted; never shown again after saving."}
                      </>
                    ) : null}
                  </>
                }
              >
                {field.multiline ? (
                  <Textarea
                    id={inputId}
                    name={field.key}
                    rows={4}
                    defaultValue={value}
                    placeholder={stored ? "•••••••• saved" : field.placeholder}
                  />
                ) : (
                  <Input
                    id={inputId}
                    name={field.key}
                    defaultValue={value}
                    placeholder={stored ? "•••••••• saved" : field.placeholder}
                    autoComplete="off"
                  />
                )}
              </Field>
            );
          })}
          <Field
            label="Load only in these countries"
            htmlFor={`${definition.provider}-regions`}
            hint="Two-letter country codes, comma separated. Leave empty to load everywhere (still subject to consent)."
          >
            <Input
              id={`${definition.provider}-regions`}
              name="loadsInRegions"
              defaultValue={integration.loadsInRegions.join(", ")}
              placeholder="IN, AE, GB"
            />
          </Field>
          <Field label="Your notes" htmlFor={`${definition.provider}-notes`}>
            <Textarea
              id={`${definition.provider}-notes`}
              name="notes"
              rows={2}
              defaultValue={integration.notes ?? ""}
              placeholder="Why this is on, who asked for it, which campaign."
            />
          </Field>
          <CheckboxField
            name="isEnabled"
            label="Enabled"
            defaultChecked={integration.isEnabled}
            hint="Off until an ID is entered. Enabling never overrides consent."
          />
          <p className="rounded-md border border-accent-border/40 bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
            {definition.notes}
          </p>
        </div>
      </ActionForm>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border/70 pt-4">
        <div className="text-xs text-muted-foreground">
          <p>
            Last tested:{" "}
            <span className={status === "failed" ? "text-error" : undefined}>
              {status ? status : "never"}
            </span>{" "}
            · Last verified: {formatDate(integration.lastVerifiedAt)}
          </p>
          {integration.lastTestMessage ? (
            <p className="mt-1 max-w-prose">{integration.lastTestMessage}</p>
          ) : null}
        </div>
        <ActionForm
          action="/api/admin/integrations/test"
          method="POST"
          submitLabel="Test connection"
          variant="gold-outline"
          size="sm"
          inline
          disabled={!canEdit}
          payload={{ provider: definition.provider }}
          successMessage="Tested — reload to see the result."
        />
      </div>
    </Panel>
  );
}
