import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import {
  CheckboxField,
  EmptyState,
  Field,
  OfflineNote,
  Panel,
} from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { CONTENT_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { listFaqsAdmin } from "@/lib/admin/content";
import { getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "FAQs" };
export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const db = getDb();
  const [faqs, session] = await Promise.all([listFaqsAdmin(db), getAdminSession()]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);
  const groups = new Map<string, typeof faqs>();
  for (const f of faqs) {
    const key = f.routePattern ?? `location:${f.locationId}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="FAQs"
        description="Attached to a route (e.g. / or /services/kundli-analysis) or a location. Phrase every question as a person would ask it; answers are 40–60 self-contained words (CLAUDE.md §9.2)."
      />
      <SubNav items={CONTENT_NAV} current="/admin/content/faqs" label="Content sections" />
      {!db ? <OfflineNote /> : null}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          {faqs.length === 0 ? <EmptyState title="No FAQs yet" /> : null}
          {[...groups.entries()].map(([key, rows]) => (
            <Panel
              key={key}
              title={key.startsWith("location:") ? "Location FAQ" : key}
              description={`${rows.length} question${rows.length === 1 ? "" : "s"}`}
              bodyClassName="p-0"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-muted-foreground">{f.sortOrder}</TableCell>
                      <TableCell className="whitespace-normal">
                        <Link
                          href={`/admin/content/faqs/${f.id}`}
                          className="font-medium no-underline hover:underline"
                        >
                          {f.question}
                        </Link>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                          {f.answer}
                        </span>
                      </TableCell>
                      <TableCell>
                        <BoolBadge value={f.isPublished} on="Live" off="Draft" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          ))}
        </div>
        <Panel title="Add a FAQ">
          <ActionForm action="/api/admin/faqs" submitLabel="Add FAQ" disabled={!canEdit}>
            <Field
              label="Route pattern"
              htmlFor="routePattern"
              hint="e.g. /, /faq, /services/kundli-analysis"
            >
              <Input id="routePattern" name="routePattern" placeholder="/faq" />
            </Field>
            <Field label="Question" htmlFor="question">
              <Input
                id="question"
                name="question"
                required
                minLength={10}
                placeholder="Do I need my exact birth time for a kundli?"
              />
            </Field>
            <Field label="Answer" htmlFor="answer" hint="Name the subject explicitly; 40–60 words.">
              <Textarea id="answer" name="answer" required minLength={20} rows={5} />
            </Field>
            <Field label="Sort order" htmlFor="sortOrder">
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={(groups.size + 1) * 10}
              />
            </Field>
            <CheckboxField name="isPublished" label="Publish immediately" defaultChecked={false} />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
