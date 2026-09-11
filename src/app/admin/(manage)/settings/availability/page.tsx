import type { Metadata } from "next";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { AvailabilityGrid } from "@/components/admin/manage/availability-grid";
import { fmtDate } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import {
  CheckboxField,
  EmptyState,
  Field,
  OfflineNote,
  Panel,
} from "@/components/admin/manage/panel";
import { SETTINGS_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Input } from "@/components/ui/input";
import { getAdminSession } from "@/lib/admin/auth";
import { getAvailabilityAdmin } from "@/lib/admin/settings";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const db = getDb();
  const [settings, session, availability] = await Promise.all([
    getSiteSettings(),
    getAdminSession(),
    getAvailabilityAdmin(db),
  ]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Availability"
        description={`Weekly hours and exceptions in ${settings.timezone}. Slots are generated from these, the service duration and buffers, a ${settings.leadTimeHours}-hour lead time and a ${settings.horizonDays}-day horizon (Site → Identity).`}
      />
      <SubNav
        items={SETTINGS_NAV}
        current="/admin/settings/availability"
        label="Settings sections"
      />
      {!db ? <OfflineNote what="Hours" /> : null}
      <div className="flex flex-col gap-6">
        <Panel
          title="Weekly hours"
          description="Open intervals per weekday. Save replaces the whole grid."
        >
          <AvailabilityGrid
            initial={availability.rules.map((r) => ({
              weekday: r.weekday,
              startTime: r.startTime,
              endTime: r.endTime,
            }))}
            timezone={settings.timezone}
            disabled={!canEdit}
            placeholder={availability.placeholderRules}
          />
        </Panel>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Panel
            title="Exceptions"
            description="Blocked ranges (holidays, travel) or extra open days outside the weekly rules."
            bodyClassName="p-0"
          >
            {availability.exceptions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No upcoming exceptions"
                  hint="Add a blocked range for holidays or travel."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {availability.exceptions.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <span
                      className={
                        e.isBlocked
                          ? "rounded-full bg-error-soft px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-error uppercase"
                          : "rounded-full bg-success-soft px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-success uppercase"
                      }
                    >
                      {e.isBlocked ? "Blocked" : "Open"}
                    </span>
                    <span className="font-medium">
                      {fmtDate(e.startsAt, settings.timezone)} →{" "}
                      {fmtDate(new Date(e.endsAt.getTime() - 1), settings.timezone)}
                    </span>
                    {e.reason ? <span className="text-muted-foreground">{e.reason}</span> : null}
                    {canEdit ? (
                      <span className="ml-auto">
                        <ActionForm
                          action={`/api/admin/availability/exceptions/${e.id}`}
                          method="DELETE"
                          submitLabel="Remove"
                          variant="ghost"
                          size="xs"
                          inline
                          confirm="Remove this exception?"
                          successMessage="Removed."
                        />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Add an exception">
            <ActionForm
              action="/api/admin/availability/exceptions"
              submitLabel="Add exception"
              disabled={!canEdit}
              successMessage="Exception added."
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="From" htmlFor="fromDate">
                  <Input id="fromDate" name="fromDate" type="date" required />
                </Field>
                <Field label="To (inclusive)" htmlFor="toDate">
                  <Input id="toDate" name="toDate" type="date" required />
                </Field>
              </div>
              <Field label="Reason (internal)" htmlFor="reason">
                <Input id="reason" name="reason" placeholder="Diwali break" maxLength={200} />
              </Field>
              <CheckboxField
                name="isBlocked"
                label="Block these days"
                hint="Untick to open the days even if the weekly grid is closed."
                defaultChecked
              />
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
