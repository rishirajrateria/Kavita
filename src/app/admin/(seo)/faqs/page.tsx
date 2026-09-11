/**
 * `/admin/faqs` — the FAQ manager: which questions appear on which routes. FAQs themselves are
 * written under Content → FAQs; here they are attached (one FAQ to many routes, exactly or by
 * glob), ordered, published, and previewed as the FAQPage JSON-LD the page will emit.
 */
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
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminSession } from "@/lib/admin/auth";
import { listFaqsAdmin } from "@/lib/admin/content";
import { lintAnswer } from "@/lib/seo/aeo";
import { listAttachments, type AttachmentWithFaq } from "@/lib/seo/faq-attach";
import { patternMatches } from "@/lib/seo/route-pattern";
import { faqPageSchema, withSpeakable } from "@/lib/seo/schema";

export const metadata: Metadata = { title: "FAQs" };
export const dynamic = "force-dynamic";

export default async function FaqManagerPage({ searchParams }: PageProps<"/admin/faqs">) {
  const params = await searchParams;
  const previewRoute =
    typeof params.preview === "string" && params.preview.startsWith("/") ? params.preview : "/";
  const db = getDb();
  const [faqs, attachments, session] = await Promise.all([
    listFaqsAdmin(db),
    listAttachments(db),
    getAdminSession(),
  ]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);

  const groups = new Map<string, AttachmentWithFaq[]>();
  for (const a of attachments) {
    groups.set(a.attachment.routePattern, [...(groups.get(a.attachment.routePattern) ?? []), a]);
  }
  const onPreviewRoute = attachments
    .filter(
      (a) =>
        a.attachment.isPublished &&
        a.faq.isPublished &&
        patternMatches(a.attachment.routePattern, previewRoute),
    )
    .map(({ faq }) => ({ question: faq.question, answer: faq.answer }));
  const jsonLd = JSON.stringify(withSpeakable(faqPageSchema(onPreviewRoute), [".answer"]), null, 2);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="FAQ manager"
        description="Every page with an FAQ block emits FAQPage JSON-LD (CLAUDE.md §8). Attach a question to one route or to a whole branch; answers stay 40–60 self-contained words so an assistant can quote them."
      />
      <SeoNav current="/admin/faqs" />
      {!db ? <OfflineNote what="Attachments" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Attach questions to a route"
            description="Tick the questions, give the route or pattern, save. Re-attaching an existing pair just updates it."
          >
            {faqs.length === 0 ? (
              <EmptyState
                title="No FAQs written yet"
                hint={<Link href="/admin/content/faqs">Write one under Content → FAQs first.</Link>}
              />
            ) : (
              <ActionForm
                action="/api/admin/faqs/bulk-attach"
                submitLabel="Attach selected"
                disabled={!canEdit}
                successMessage="Attached."
              >
                <Field
                  label="Route or pattern"
                  htmlFor="routePattern"
                  hint="/contact, or /astrologer/india/* for every page under India."
                >
                  <Input
                    id="routePattern"
                    name="routePattern"
                    required
                    placeholder="/astrologer/india/*"
                    spellCheck={false}
                  />
                </Field>
                <fieldset className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-md border border-border/70 p-3">
                  <legend className="px-1 text-sm font-medium">Questions</legend>
                  {faqs.map((faq) => {
                    const lint = lintAnswer(faq.answer);
                    return (
                      <label key={faq.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="faqIds[]"
                          value={faq.id}
                          className="mt-1 size-4 accent-[var(--accent-strong)]"
                        />
                        <span>
                          {faq.question}
                          <span className="block text-xs text-muted-foreground">
                            {lint.wordCount} words
                            {lint.issues.length > 0
                              ? ` · ${lint.issues[0]?.message}`
                              : " · reads well alone"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
                <CheckboxField name="isPublished" label="Publish straight away" defaultChecked />
              </ActionForm>
            )}
          </Panel>

          {[...groups.entries()].map(([pattern, rows]) => (
            <Panel
              key={pattern}
              title={pattern}
              description={`${rows.length} attached`}
              bodyClassName="p-0"
              actions={
                <Link
                  href={`/admin/faqs?preview=${encodeURIComponent(pattern.replace(/\*.*$/, ""))}`}
                  className="text-xs no-underline hover:underline"
                >
                  Preview JSON-LD
                </Link>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-16">Order</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Shown</TableHead>
                      <TableHead className="w-40">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ attachment, faq }) => (
                      <TableRow key={attachment.id}>
                        <TableCell>
                          <ActionForm
                            action={`/api/admin/faqs/attachments/${attachment.id}`}
                            method="PATCH"
                            inline
                            size="xs"
                            variant="outline"
                            submitLabel="Set"
                            disabled={!canEdit}
                          >
                            <Input
                              name="sortOrder"
                              type="number"
                              min={0}
                              max={9999}
                              defaultValue={attachment.sortOrder}
                              aria-label={`Sort order for ${faq.question}`}
                              className="h-8 w-20"
                            />
                          </ActionForm>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <Link
                            href={`/admin/content/faqs/${faq.id}`}
                            className="font-medium no-underline hover:underline"
                          >
                            {faq.question}
                          </Link>
                          <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                            {faq.answer}
                          </span>
                        </TableCell>
                        <TableCell>
                          <BoolBadge
                            value={attachment.isPublished && faq.isPublished}
                            on="Live"
                            off={faq.isPublished ? "Hidden" : "FAQ draft"}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <ActionForm
                              action={`/api/admin/faqs/attachments/${attachment.id}`}
                              method="PATCH"
                              inline
                              size="xs"
                              variant="outline"
                              submitLabel={attachment.isPublished ? "Hide" : "Show"}
                              payload={{ isPublished: attachment.isPublished ? "off" : "on" }}
                              disabled={!canEdit}
                            />
                            <ActionForm
                              action={`/api/admin/faqs/attachments/${attachment.id}`}
                              method="DELETE"
                              inline
                              size="xs"
                              variant="destructive"
                              submitLabel="Detach"
                              confirm={`Detach “${faq.question}” from ${pattern}?`}
                              disabled={!canEdit}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          ))}
          {attachments.length === 0 ? (
            <EmptyState
              title="Nothing attached yet"
              hint="Pages still show the FAQs written into the page itself; attachments are added on top of those."
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="FAQPage JSON-LD"
            description="Exactly what the page emits for the route below, attachments included."
          >
            <form method="get" action="/admin/faqs" className="mb-4 flex flex-wrap items-end gap-2">
              <Field label="Route" htmlFor="preview" className="flex-1">
                <Input
                  id="preview"
                  name="preview"
                  defaultValue={previewRoute}
                  spellCheck={false}
                  placeholder="/astrologer/india/maharashtra/mumbai"
                />
              </Field>
              <button
                type="submit"
                className="h-9 rounded-md border border-input px-3 text-sm shadow-xs"
              >
                Preview
              </button>
            </form>
            {onPreviewRoute.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attached questions match {previewRoute}. The page still emits the FAQs written
                into it.
              </p>
            ) : (
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted/50 p-3 font-mono text-[0.7rem] leading-relaxed">
                {jsonLd}
              </pre>
            )}
          </Panel>
          <Panel title="How attachment works">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Attached questions are appended after the ones written into the page, and a
                duplicate question (same wording) is dropped.
              </li>
              <li>
                A glob attaches to a whole branch: <code>/vastu-consultant/*</code> covers every
                vastu location page.
              </li>
              <li>A question only appears when both the FAQ and its attachment are published.</li>
              <li>Order is lowest first; ties fall back to when the attachment was made.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
