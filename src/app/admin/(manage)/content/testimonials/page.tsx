import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDate } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, OfflineNote } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { CONTENT_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTestimonials, type TestimonialFilter } from "@/lib/admin/content";
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

const FILTERS: { key: TestimonialFilter; label: string }[] = [
  { key: "submissions", label: "Submissions" },
  { key: "published", label: "Published" },
  { key: "unpublished", label: "Unpublished" },
  { key: "all", label: "All" },
];

export default async function TestimonialsPage({
  searchParams,
}: PageProps<"/admin/content/testimonials">) {
  const params = await searchParams;
  const filter = (FILTERS.find((f) => f.key === params.filter)?.key ??
    "submissions") as TestimonialFilter;
  const db = getDb();
  const [rows, settings, session] = await Promise.all([
    listTestimonials(db, filter),
    getSiteSettings(),
    getAdminSession(),
  ]);
  const canEdit = session?.adminUser.role !== "viewer";

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Testimonials"
        description="Only real, consented client feedback is ever published (CLAUDE.md §12). Website submissions wait here for approval."
      />
      <SubNav items={CONTENT_NAV} current="/admin/content/testimonials" label="Content sections" />
      {!db ? <OfflineNote what="Approvals" /> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/content/testimonials?filter=${f.key}`}
            aria-current={f.key === filter ? "page" : undefined}
            className="rounded-full border border-border px-3 py-1 text-xs no-underline hover:border-accent-border aria-[current=page]:border-accent-strong aria-[current=page]:bg-accent"
          >
            {f.label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title={db ? "Nothing here" : "Connect Supabase to review submissions"}
          hint={
            db
              ? "New website submissions appear under Submissions."
              : "Testimonials live only in the database; there is no seed for them by design."
          }
        />
      ) : (
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Client</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead>Consent</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t, i) => (
              <TableRow key={t.id} className={i % 2 ? "bg-muted/20" : undefined}>
                <TableCell>
                  <Link
                    href={`/admin/content/testimonials/${t.id}`}
                    className="font-medium no-underline hover:underline"
                  >
                    {t.clientName}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {t.date
                      ? fmtDate(t.date, settings.timezone)
                      : fmtDate(t.createdAt, settings.timezone)}
                    {t.rating ? ` · ${t.rating}/5` : ""}
                  </span>
                </TableCell>
                <TableCell className="max-w-[24rem] truncate whitespace-normal" title={t.quote}>
                  <span className="line-clamp-2">{t.quote}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {t.source.replace(/_/g, " ")}
                </TableCell>
                <TableCell>
                  <BoolBadge value={t.consentGiven} on="Given" off="Missing" />
                </TableCell>
                <TableCell>
                  <BoolBadge value={t.isPublished} on="Live" off="Draft" />
                </TableCell>
                <TableCell className="text-right">
                  {canEdit ? (
                    <ActionForm
                      action={`/api/admin/testimonials/${t.id}`}
                      method="PATCH"
                      payload={{ isPublished: !t.isPublished }}
                      submitLabel={t.isPublished ? "Unpublish" : "Publish"}
                      variant={t.isPublished ? "outline" : "gold"}
                      size="xs"
                      inline
                      disabled={!db || (!t.isPublished && (!t.consentGiven || t.isPlaceholder))}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
