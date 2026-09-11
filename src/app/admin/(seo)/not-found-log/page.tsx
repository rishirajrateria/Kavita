/**
 * `/admin/not-found-log` — paths that returned 404, sorted by hits, each with a one-click
 * "create redirect" that pre-fills the redirect form.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDateTime } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, OfflineNote } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { SEARCH_TOOLS_NAV } from "@/components/admin/redirects/nav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";
import { listNotFound } from "@/lib/redirects/not-found-log";

export const metadata: Metadata = { title: "404 log" };
export const dynamic = "force-dynamic";

export default async function NotFoundLogPage({ searchParams }: PageProps<"/admin/not-found-log">) {
  const params = await searchParams;
  const showResolved = params.resolved === "1";
  const db = getDb();
  const [rows, settings, session] = await Promise.all([
    listNotFound(200, showResolved),
    getSiteSettings(),
    getAdminSession(),
  ]);
  const canEdit = session?.adminUser.role !== "viewer";

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="404 log"
        description="Every missing page visitors and crawlers asked for, counted. Fix the popular ones with a redirect; the row is marked resolved once a rule exists."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={showResolved ? "/admin/not-found-log" : "/admin/not-found-log?resolved=1"}>
              {showResolved ? "Hide resolved" : "Show resolved"}
            </Link>
          </Button>
        }
      />
      <SubNav items={SEARCH_TOOLS_NAV} current="/admin/not-found-log" label="Search tools" />
      {!db ? <OfflineNote what="404 entries" /> : null}
      {rows.length === 0 ? (
        <EmptyState
          title={db ? "No 404s logged" : "Connect Supabase to see the 404 log"}
          hint={
            db
              ? "Paths are recorded when the not-found page renders (asset probes and admin paths are ignored)."
              : "The log is written by the not-found page and lives only in the database."
          }
        />
      ) : (
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Path</TableHead>
              <TableHead className="text-right">Hits</TableHead>
              <TableHead className="hidden md:table-cell">Last seen</TableHead>
              <TableHead className="hidden lg:table-cell">Last referrer</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id} className={i % 2 ? "bg-muted/20" : undefined}>
                <TableCell className="max-w-[28rem] font-mono text-xs break-all whitespace-normal">
                  {r.path}
                  <span className="block font-sans text-muted-foreground">
                    first seen {fmtDateTime(r.firstSeen, settings.timezone)}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.hits.toLocaleString("en")}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {fmtDateTime(r.lastSeen, settings.timezone)}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {r.lastReferrer ?? "—"}
                </TableCell>
                <TableCell>
                  <BoolBadge
                    value={r.redirected || r.resolvedAt !== null}
                    on={r.redirected ? "Redirected" : "Resolved"}
                    off="Open"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {!r.redirected && canEdit ? (
                      <Button asChild variant="gold-outline" size="xs">
                        <Link href={`/admin/redirects?from=${encodeURIComponent(r.path)}`}>
                          Create redirect
                        </Link>
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <ActionForm
                        action={`/api/admin/not-found-log/${r.id}`}
                        method="DELETE"
                        inline
                        size="xs"
                        variant="ghost"
                        submitLabel="Dismiss"
                        disabled={!db}
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
