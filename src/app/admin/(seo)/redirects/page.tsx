/**
 * `/admin/redirects` — the redirect engine: every rule with hits and chain warnings, a create
 * form (pre-filled from the 404 log via `?from=`), CSV import and export.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDateTime } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { SEARCH_TOOLS_NAV } from "@/components/admin/redirects/nav";
import { RedirectFields } from "@/components/admin/redirects/redirect-fields";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";
import { checkChain } from "@/lib/redirects/graph";
import { listRedirects, type Redirect } from "@/lib/redirects/store";

export const metadata: Metadata = { title: "Redirects" };
export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<Redirect["source"], string> = {
  manual: "Manual",
  slug_change: "Slug change",
  not_found_fix: "404 fix",
  import: "Import",
};

export default async function RedirectsPage({ searchParams }: PageProps<"/admin/redirects">) {
  const params = await searchParams;
  const prefill = typeof params.from === "string" && params.from.startsWith("/") ? params.from : "";
  const db = getDb();
  const [rows, settings, session] = await Promise.all([
    db ? listRedirects(db) : Promise.resolve([] as Redirect[]),
    getSiteSettings(),
    getAdminSession(),
  ]);
  const canEdit = session?.adminUser.role !== "viewer";
  const rules = rows.map((r) => ({
    id: r.id,
    fromPath: r.fromPath,
    toPath: r.toPath,
    matchType: r.matchType,
    statusCode: r.statusCode,
  }));
  const active = rows.filter((r) => r.isActive);
  const chains = new Map<string, ReturnType<typeof checkChain>>();
  for (const r of active)
    chains.set(
      r.id,
      checkChain(
        r,
        rules.filter((x) => x.id !== r.id),
      ),
    );
  const chained = [...chains.values()].filter((c) => c.chain.length > 0).length;
  const totalHits = rows.reduce((n, r) => n + r.hitCount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Redirects"
        description="Slugs are immutable once published; when one must change, a 301 is mandatory (CLAUDE.md §5). Rules are matched in the proxy before any page renders."
        actions={
          <Button asChild variant="outline" size="sm">
            {/* A file download from a route handler, not a page: `next/link` would try to
                client-navigate to it. */}
            <a href="/api/admin/redirects/export" download>
              Export CSV
            </a>
          </Button>
        }
      />
      <SubNav items={SEARCH_TOOLS_NAV} current="/admin/redirects" label="Search tools" />
      {!db ? <OfflineNote what="Redirects" /> : null}

      <dl className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Active rules" value={String(active.length)} />
        <Stat label="Hits recorded" value={totalHits.toLocaleString("en")} />
        <Stat
          label="Chains to collapse"
          value={String(chained)}
          tone={chained > 0 ? "warn" : "ok"}
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title={prefill ? `Fix ${prefill}` : "Add a redirect"}
          description="Loops are refused at save time; chains are warned about and can be collapsed."
        >
          <ActionForm
            action="/api/admin/redirects"
            method="POST"
            submitLabel="Create redirect"
            disabled={!db || !canEdit}
            payload={prefill ? { source: "not_found_fix" } : undefined}
            successMessage="Redirect created. The cache refreshes within a minute on every instance."
            redirectTo={prefill ? "/admin/not-found-log" : undefined}
          >
            <RedirectFields values={{ fromPath: prefill }} idPrefix="new" />
          </ActionForm>
        </Panel>
        <Panel
          title="Import CSV"
          description="Columns: source,destination,type,note[,match]. Existing sources are updated; loops are skipped."
        >
          <ActionForm
            action="/api/admin/redirects/import"
            method="POST"
            submitLabel="Import"
            variant="gold-outline"
            disabled={!db || !canEdit}
            successMessage="Imported. Check the list below for what was created or updated."
          >
            <Field label="CSV" htmlFor="csv">
              <Textarea
                id="csv"
                name="csv"
                rows={8}
                spellCheck={false}
                placeholder={
                  "source,destination,type,note\n/old-page,/new-page,301,Renamed in 2026"
                }
                className="font-mono text-xs"
              />
            </Field>
          </ActionForm>
        </Panel>
      </div>

      <h2 className="mt-8 mb-3 font-serif text-xl font-medium">All rules</h2>
      {rows.length === 0 ? (
        <EmptyState
          title={db ? "No redirects yet" : "Connect Supabase to manage redirects"}
          hint={
            db
              ? "Rules created here, by slug changes and from the 404 log all appear in this list."
              : "Redirect rules live only in the database."
          }
        />
      ) : (
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Rule</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="text-right">Hits</TableHead>
              <TableHead className="hidden lg:table-cell">Last hit</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const check = chains.get(r.id);
              return (
                <TableRow key={r.id} className={i % 2 ? "bg-muted/20" : undefined}>
                  <TableCell className="max-w-[28rem] whitespace-normal">
                    <Link
                      href={`/admin/redirects/${r.id}`}
                      className="font-mono text-xs font-medium break-all no-underline hover:underline"
                    >
                      {r.fromPath}
                    </Link>
                    <span className="block font-mono text-xs break-all text-muted-foreground">
                      → {r.statusCode === 410 ? "gone (410)" : r.toPath}
                    </span>
                    {r.note ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{r.note}</span>
                    ) : null}
                    {check && check.chain.length > 0 && check.finalDestination ? (
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-warning">
                        Chain via {check.chain.length} hop(s) → {check.finalDestination}
                        {canEdit ? (
                          <ActionForm
                            action={`/api/admin/redirects/${r.id}`}
                            method="PATCH"
                            inline
                            size="xs"
                            variant="outline"
                            submitLabel="Collapse"
                            payload={{
                              fromPath: r.fromPath,
                              toPath: r.toPath,
                              matchType: r.matchType,
                              statusCode: r.statusCode,
                              isActive: r.isActive,
                              note: r.note,
                              collapseChain: true,
                            }}
                          />
                        ) : null}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="block text-xs">{r.statusCode}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.matchType} · {SOURCE_LABEL[r.source]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.hitCount.toLocaleString("en")}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {r.lastHitAt ? fmtDateTime(r.lastHitAt, settings.timezone) : "—"}
                  </TableCell>
                  <TableCell>
                    <BoolBadge value={r.isActive} on="Active" off="Off" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild variant="outline" size="xs">
                        <Link href={`/admin/redirects/${r.id}`}>Edit</Link>
                      </Button>
                      {canEdit ? (
                        <ActionForm
                          action={`/api/admin/redirects/${r.id}`}
                          method="DELETE"
                          inline
                          size="xs"
                          variant="ghost"
                          submitLabel="Delete"
                          confirm={`Delete the redirect for ${r.fromPath}?`}
                          disabled={!db}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-accent-border/40 bg-card px-5 py-4 shadow-xs">
      <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 font-serif text-2xl font-medium tabular-nums ${
          tone === "warn" ? "text-warning" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
