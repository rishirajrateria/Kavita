import type { Metadata } from "next";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { SETTINGS_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminSession } from "@/lib/admin/auth";
import { listTemplates } from "@/lib/admin/settings";
import { getNotificationEnv } from "@/lib/notifications/env";
import type { NotificationKind } from "@/lib/notifications/types";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const KINDS: {
  kind: NotificationKind;
  label: string;
  recipients: ("client" | "practitioner")[];
  when: string;
}[] = [
  {
    kind: "confirmation",
    label: "Booking confirmation",
    recipients: ["client", "practitioner"],
    when: "Right after a booking is made",
  },
  {
    kind: "reminder_24h",
    label: "Reminder — 24 hours",
    recipients: ["client"],
    when: "About a day before the session",
  },
  {
    kind: "reminder_1h",
    label: "Reminder — 1 hour",
    recipients: ["client"],
    when: "An hour before the session",
  },
  {
    kind: "reschedule",
    label: "Rescheduled",
    recipients: ["client", "practitioner"],
    when: "When a session is moved",
  },
  {
    kind: "cancellation",
    label: "Cancelled",
    recipients: ["client", "practitioner"],
    when: "When a session is cancelled",
  },
];

export default async function NotificationsPage() {
  const db = getDb();
  const [templates, session] = await Promise.all([listTemplates(db), getAdminSession()]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);
  const env = getNotificationEnv();
  const find = (kind: string, recipient: string) =>
    templates.find((t) => t.kind === kind && t.recipient === recipient);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Notifications"
        description="Each message is a reviewed React Email template. Here you can override the subject line and add an opening paragraph; the body, both-timezone panel and disclaimer stay as designed."
      />
      <SubNav
        items={SETTINGS_NAV}
        current="/admin/settings/notifications"
        label="Settings sections"
      />
      {!db ? <OfflineNote what="Overrides" /> : null}
      <Panel className="mb-6" bodyClassName="py-3">
        <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Email provider</dt>
            <dd className="font-medium">
              {env.RESEND_API_KEY
                ? "Resend (connected)"
                : "Not configured — messages are logged, not sent"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sender</dt>
            <dd className="font-medium">{env.EMAIL_FROM ?? "EMAIL_FROM unset"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Placeholders</dt>
            <dd className="font-mono">
              {"{{clientFirstName}} {{serviceName}} {{date}} {{brandName}} {{bookingRef}}"}
            </dd>
          </div>
        </dl>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        {KINDS.flatMap((k) =>
          k.recipients.map((recipient) => {
            const t = find(k.kind, recipient);
            return (
              <Panel
                key={`${k.kind}-${recipient}`}
                title={`${k.label} · ${recipient}`}
                description={k.when}
              >
                <ActionForm
                  action="/api/admin/notification-templates"
                  method="PUT"
                  payload={{ kind: k.kind, recipient }}
                  submitLabel="Save override"
                  size="sm"
                  disabled={!canEdit}
                  successMessage="Override saved."
                >
                  <Field
                    label="Subject override"
                    htmlFor={`${k.kind}-${recipient}-subject`}
                    hint="Leave empty to keep the template's subject."
                  >
                    <Input
                      id={`${k.kind}-${recipient}-subject`}
                      name="subject"
                      defaultValue={t?.subject ?? ""}
                      maxLength={160}
                      placeholder="Your {{serviceName}} is booked — {{date}}"
                    />
                  </Field>
                  <Field
                    label="Opening paragraph"
                    htmlFor={`${k.kind}-${recipient}-intro`}
                    hint="Inserted under the heading, before the appointment details."
                  >
                    <Textarea
                      id={`${k.kind}-${recipient}-intro`}
                      name="intro"
                      defaultValue={t?.intro ?? ""}
                      rows={3}
                      maxLength={1200}
                      placeholder="Namaste {{clientFirstName}}, thank you for booking."
                    />
                  </Field>
                  <CheckboxField
                    name="isEnabled"
                    label="Override enabled"
                    defaultChecked={t?.isEnabled ?? true}
                  />
                </ActionForm>
              </Panel>
            );
          }),
        )}
      </div>
    </>
  );
}
