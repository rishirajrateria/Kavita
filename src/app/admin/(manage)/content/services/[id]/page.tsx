import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { CURRENCIES, DELIVERY_MODES, SERVICE_LEADS } from "@/db/schema";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getServiceAdmin } from "@/lib/admin/content";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Service" };
export const dynamic = "force-dynamic";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs dark:bg-input/30";

export default async function ServiceEditPage({
  params,
}: PageProps<"/admin/content/services/[id]">) {
  const { id } = await params;
  const session = await requireAdmin();
  const db = getDb();
  const s = await getServiceAdmin(db, id);
  if (!s) notFound();
  const canEdit = session.adminUser.role !== "viewer" && Boolean(db);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/content/services" className="no-underline hover:underline">
            ← Services
          </Link>
        }
        title={s.name}
        description={`/services/${s.slug} · changing the slug creates the mandatory 301 automatically (CLAUDE.md §5).`}
      />
      {!db ? <OfflineNote /> : null}
      <ActionForm
        action={`/api/admin/services/${s.id}`}
        method="PATCH"
        submitLabel="Save service"
        disabled={!canEdit}
        className="gap-6"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Basics">
            <div className="flex flex-col gap-4">
              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" defaultValue={s.name} required />
              </Field>
              <Field
                label="URL slug"
                htmlFor="slug"
                hint="Lowercase, hyphenated. On change, /services/<old> redirects (301) to the new address and both URLs are sent to IndexNow."
              >
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={s.slug}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  required
                />
              </Field>
              <Field
                label="Lead"
                htmlFor="lead"
                hint="Astrology-led, vastu-led or integrated — shown on the service page."
              >
                <select id="lead" name="lead" defaultValue={s.lead} className={selectClass}>
                  {SERVICE_LEADS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Duration (min)" htmlFor="durationMinutes">
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min={15}
                    max={480}
                    step={5}
                    defaultValue={s.durationMinutes}
                  />
                </Field>
                <Field label="Buffer before" htmlFor="bufferBeforeMinutes">
                  <Input
                    id="bufferBeforeMinutes"
                    name="bufferBeforeMinutes"
                    type="number"
                    min={0}
                    max={120}
                    step={5}
                    defaultValue={s.bufferBeforeMinutes}
                  />
                </Field>
                <Field label="Buffer after" htmlFor="bufferAfterMinutes">
                  <Input
                    id="bufferAfterMinutes"
                    name="bufferAfterMinutes"
                    type="number"
                    min={0}
                    max={120}
                    step={5}
                    defaultValue={s.bufferAfterMinutes}
                  />
                </Field>
              </div>
              <Field label="Delivery modes">
                <div className="flex flex-wrap gap-3">
                  {DELIVERY_MODES.map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="deliveryModes[]"
                        value={m}
                        defaultChecked={s.deliveryModes.includes(m)}
                        className="size-4 accent-[var(--accent-strong)]"
                      />
                      {m.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sort order" htmlFor="sortOrder">
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={s.sortOrder}
                  />
                </Field>
                <CheckboxField
                  name="isActive"
                  label="Active (bookable and listed)"
                  defaultChecked={s.isActive}
                  className="self-end"
                />
              </div>
            </div>
          </Panel>
          <Panel
            title="Pricing"
            description="Minor units (paise, cents, pence, fils). Leave the headline price empty for “on request”."
          >
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[1fr_8rem] gap-3">
                <Field label="Headline price (minor units)" htmlFor="priceMinor">
                  <Input
                    id="priceMinor"
                    name="priceMinor"
                    type="number"
                    min={0}
                    defaultValue={s.priceMinor ?? ""}
                  />
                </Field>
                <Field label="Currency" htmlFor="currency">
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={s.currency ?? ""}
                    className={selectClass}
                  >
                    <option value="">—</option>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Price note (shown when there is no headline price)" htmlFor="priceNote">
                <Input id="priceNote" name="priceNote" defaultValue={s.priceNote ?? ""} />
              </Field>
              <Field
                label="Per-currency prices"
                hint="Used by the geo pages for the client's currency."
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CURRENCIES.map((c) => (
                    <label key={c} className="flex flex-col gap-1 text-xs font-medium">
                      {c}
                      <Input
                        name={`prices.${c}`}
                        type="number"
                        min={0}
                        defaultValue={s.prices[c] ?? ""}
                      />
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </Panel>
        </div>
        <Panel title="Copy" description="Plain text; one item per line for the lists.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Short description" htmlFor="shortDescription" className="lg:col-span-2">
              <Textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                defaultValue={s.shortDescription}
              />
            </Field>
            <Field label="Description" htmlFor="description" className="lg:col-span-2">
              <Textarea id="description" name="description" rows={6} defaultValue={s.description} />
            </Field>
            <Field label="What to prepare" htmlFor="whatToPrepare">
              <Textarea
                id="whatToPrepare"
                name="whatToPrepare"
                rows={5}
                defaultValue={s.whatToPrepare.join("\n")}
              />
            </Field>
            <Field label="What you receive" htmlFor="whatYouReceive">
              <Textarea
                id="whatYouReceive"
                name="whatYouReceive"
                rows={5}
                defaultValue={s.whatYouReceive.join("\n")}
              />
            </Field>
          </div>
        </Panel>
      </ActionForm>
    </>
  );
}
