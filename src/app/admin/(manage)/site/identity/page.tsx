import type { Metadata } from "next";
import { getDb } from "@/db";
import { CURRENCIES, WEEKDAYS } from "@/db/schema";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { SITE_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Input } from "@/components/ui/input";
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Site identity" };
export const dynamic = "force-dynamic";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
  "Asia/Singapore",
];
const DAY_LABEL: Record<(typeof WEEKDAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs dark:bg-input/30";

export default async function IdentityPage() {
  const db = getDb();
  const [settings, session] = await Promise.all([getSiteSettings(), getAdminSession()]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);
  const tzOptions = TIMEZONES.includes(settings.timezone)
    ? TIMEZONES
    : [settings.timezone, ...TIMEZONES];

  return (
    <>
      <PageHeader
        eyebrow="Site"
        title="Identity"
        description="The single site_settings row: name, address and phone (NAP), hours, timezone and currency. The footer, contact page and every schema block read from here, so keep it identical to the Google Business Profile."
      />
      <SubNav items={SITE_NAV} current="/admin/site/identity" label="Site sections" />
      {!db ? <OfflineNote /> : null}
      <ActionForm
        action="/api/admin/site-settings"
        method="PATCH"
        submitLabel="Save identity"
        disabled={!canEdit}
        className="gap-6"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Brand and practitioner">
            <div className="flex flex-col gap-4">
              <Field label="Brand name" htmlFor="brandName">
                <Input id="brandName" name="brandName" defaultValue={settings.brandName} required />
              </Field>
              <Field label="Practitioner name" htmlFor="practitionerName">
                <Input
                  id="practitionerName"
                  name="practitionerName"
                  defaultValue={settings.practitionerName}
                />
              </Field>
              <Field label="Legal entity" htmlFor="legalEntity">
                <Input id="legalEntity" name="legalEntity" defaultValue={settings.legalEntity} />
              </Field>
              <Field label="Tagline" htmlFor="tagline">
                <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
              </Field>
            </div>
          </Panel>
          <Panel title="Contact (NAP)">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" name="phone" defaultValue={settings.phone} />
                </Field>
                <Field label="WhatsApp" htmlFor="whatsapp">
                  <Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} />
                </Field>
              </div>
              <Field label="Email" htmlFor="email">
                <Input id="email" name="email" defaultValue={settings.email} />
              </Field>
              <Field label="Address line 1" htmlFor="addressLine1">
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  defaultValue={settings.addressLine1 ?? ""}
                />
              </Field>
              <Field label="Address line 2" htmlFor="addressLine2">
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  defaultValue={settings.addressLine2 ?? ""}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="City" htmlFor="city">
                  <Input id="city" name="city" defaultValue={settings.city} />
                </Field>
                <Field label="Region / state" htmlFor="addressRegion">
                  <Input
                    id="addressRegion"
                    name="addressRegion"
                    defaultValue={settings.addressRegion ?? ""}
                  />
                </Field>
                <Field label="Postal code" htmlFor="addressPostalCode">
                  <Input
                    id="addressPostalCode"
                    name="addressPostalCode"
                    defaultValue={settings.addressPostalCode ?? ""}
                  />
                </Field>
                <Field label="Country" htmlFor="country">
                  <Input id="country" name="country" defaultValue={settings.country} />
                </Field>
              </div>
              <CheckboxField
                name="inPersonAvailable"
                label="In-person consultations available at this address"
                defaultChecked={settings.inPersonAvailable}
              />
            </div>
          </Panel>
          <Panel
            title="Hours"
            description="One interval per day here; leave both empty for closed. The availability grid governs bookable slots."
          >
            <div className="grid gap-2">
              {WEEKDAYS.map((d) => {
                const first = settings.businessHours[d]?.[0];
                return (
                  <div key={d} className="grid grid-cols-[6rem_1fr_1fr] items-center gap-2 text-sm">
                    <span>{DAY_LABEL[d]}</span>
                    <Input
                      type="time"
                      name={`hours.${d}.open`}
                      defaultValue={first?.open ?? ""}
                      aria-label={`${DAY_LABEL[d]} opens`}
                    />
                    <Input
                      type="time"
                      name={`hours.${d}.close`}
                      defaultValue={first?.close ?? ""}
                      aria-label={`${DAY_LABEL[d]} closes`}
                    />
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel title="Locale and booking engine">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Practitioner timezone" htmlFor="timezone">
                  <select
                    id="timezone"
                    name="timezone"
                    defaultValue={settings.timezone}
                    className={selectClass}
                  >
                    {tzOptions.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Default currency" htmlFor="defaultCurrency">
                  <select
                    id="defaultCurrency"
                    name="defaultCurrency"
                    defaultValue={settings.defaultCurrency}
                    className={selectClass}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Response time (hours)" htmlFor="responseTimeHours">
                  <Input
                    id="responseTimeHours"
                    name="responseTimeHours"
                    type="number"
                    min={1}
                    max={168}
                    defaultValue={settings.responseTimeHours}
                  />
                </Field>
                <Field label="Lead time (hours)" htmlFor="leadTimeHours">
                  <Input
                    id="leadTimeHours"
                    name="leadTimeHours"
                    type="number"
                    min={0}
                    max={720}
                    defaultValue={settings.leadTimeHours}
                  />
                </Field>
                <Field label="Booking horizon (days)" htmlFor="horizonDays">
                  <Input
                    id="horizonDays"
                    name="horizonDays"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={settings.horizonDays}
                  />
                </Field>
                <Field label="Reschedule notice (hours)" htmlFor="rescheduleNoticeHours">
                  <Input
                    id="rescheduleNoticeHours"
                    name="rescheduleNoticeHours"
                    type="number"
                    min={0}
                    max={720}
                    defaultValue={settings.rescheduleNoticeHours}
                  />
                </Field>
                <Field label="Slot step (minutes)" htmlFor="slotStepMinutes">
                  <Input
                    id="slotStepMinutes"
                    name="slotStepMinutes"
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    defaultValue={settings.slotStepMinutes}
                  />
                </Field>
              </div>
            </div>
          </Panel>
        </div>
      </ActionForm>
    </>
  );
}
