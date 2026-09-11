import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { TESTIMONIAL_SOURCES } from "@/db/schema";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, Panel } from "@/components/admin/manage/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTestimonial } from "@/lib/admin/content";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Testimonial" };
export const dynamic = "force-dynamic";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs dark:bg-input/30";

export default async function TestimonialEditPage({
  params,
}: PageProps<"/admin/content/testimonials/[id]">) {
  const { id } = await params;
  const session = await requireAdmin();
  const db = getDb();
  if (!db) notFound();
  const t = await getTestimonial(db, id);
  if (!t) notFound();
  const canEdit = session.adminUser.role !== "viewer";

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/content/testimonials" className="no-underline hover:underline">
            ← Testimonials
          </Link>
        }
        title={t.clientName}
        description={`${t.source.replace(/_/g, " ")} · ${t.isPublished ? "published" : "not published"}${t.isPlaceholder ? " · PLACEHOLDER (cannot be published)" : ""}`}
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Edit"
          description="Publishing requires consent. Ratings are shown exactly as given; never invent one."
        >
          <ActionForm
            action={`/api/admin/testimonials/${t.id}`}
            method="PATCH"
            submitLabel="Save changes"
            disabled={!canEdit}
          >
            <Field label="Client name" htmlFor="clientName">
              <Input id="clientName" name="clientName" defaultValue={t.clientName} required />
            </Field>
            <Field label="Quote" htmlFor="quote">
              <Textarea id="quote" name="quote" defaultValue={t.quote} rows={6} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Rating (1–5, blank = none)" htmlFor="rating">
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={t.rating ?? ""}
                />
              </Field>
              <Field label="Date" htmlFor="date">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={t.date ? t.date.toISOString().slice(0, 10) : ""}
                />
              </Field>
              <Field label="Source" htmlFor="source">
                <select id="source" name="source" defaultValue={t.source} className={selectClass}>
                  {TESTIMONIAL_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <CheckboxField
              name="consentGiven"
              label="The client gave explicit permission to publish this"
              defaultChecked={t.consentGiven}
            />
            <CheckboxField
              name="isPublished"
              label="Published on the site"
              defaultChecked={t.isPublished}
            />
          </ActionForm>
        </Panel>
        <Panel title="Danger zone">
          <p className="mb-3 text-sm text-muted-foreground">
            Deleting removes the row permanently; unpublishing is usually enough.
          </p>
          <ActionForm
            action={`/api/admin/testimonials/${t.id}`}
            method="DELETE"
            submitLabel="Delete testimonial"
            variant="destructive"
            size="sm"
            confirm="Delete this testimonial permanently?"
            redirectTo="/admin/content/testimonials"
            disabled={session.adminUser.role !== "owner"}
            inline
          />
          {session.adminUser.role !== "owner" ? (
            <p className="mt-2 text-xs text-muted-foreground">Owners only.</p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
