import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFaqAdmin } from "@/lib/admin/content";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";

export default async function FaqEditPage({ params }: PageProps<"/admin/content/faqs/[id]">) {
  const { id } = await params;
  const session = await requireAdmin();
  const db = getDb();
  const f = await getFaqAdmin(db, id);
  if (!f) notFound();
  const canEdit = session.adminUser.role !== "viewer" && Boolean(db);
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/content/faqs" className="no-underline hover:underline">
            ← FAQs
          </Link>
        }
        title="Edit FAQ"
        description={f.routePattern ?? `Location ${f.locationId}`}
      />
      {!db ? <OfflineNote /> : null}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Question and answer">
          <ActionForm
            action={`/api/admin/faqs/${f.id}`}
            method="PATCH"
            submitLabel="Save FAQ"
            disabled={!canEdit}
          >
            <Field label="Route pattern" htmlFor="routePattern">
              <Input id="routePattern" name="routePattern" defaultValue={f.routePattern ?? ""} />
            </Field>
            <Field label="Question" htmlFor="question">
              <Input id="question" name="question" defaultValue={f.question} required />
            </Field>
            <Field label="Answer" htmlFor="answer">
              <Textarea id="answer" name="answer" defaultValue={f.answer} rows={6} required />
            </Field>
            <Field label="Sort order" htmlFor="sortOrder">
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={f.sortOrder}
              />
            </Field>
            <CheckboxField name="isPublished" label="Published" defaultChecked={f.isPublished} />
          </ActionForm>
        </Panel>
        <Panel title="Danger zone">
          <ActionForm
            action={`/api/admin/faqs/${f.id}`}
            method="DELETE"
            submitLabel="Delete FAQ"
            variant="destructive"
            size="sm"
            confirm="Delete this FAQ?"
            redirectTo="/admin/content/faqs"
            disabled={!canEdit}
            inline
          />
        </Panel>
      </div>
    </>
  );
}
