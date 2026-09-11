import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { buildHref, type SearchParams } from "@/components/admin/filters/search-params";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDate } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Fact, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { TablePagination } from "@/components/admin/tables/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminSession } from "@/lib/admin/auth";
import {
  checkRevertable,
  diffLines,
  getAuditEntry,
  listAuditEntityTypes,
  listAuditEntries,
  REVERTABLE_ENTITIES,
  type AuditRow,
} from "@/lib/admin/revert";
import { getSiteSettings } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/audit";
const PAGE_SIZE = 25;

function one(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

function verb(action: string): string {
  return action.split(".").pop() ?? action;
}

const VERB_TONE: Record<string, string> = {
  create: "bg-success-soft text-success",
  update: "bg-info-soft text-info",
  delete: "bg-error-soft text-error",
  revert: "bg-warning-soft text-warning",
};

function VerbPill({ action }: { action: string }) {
  const v = verb(action);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase",
        VERB_TONE[v] ?? "bg-muted text-muted-foreground",
      )}
    >
      {v}
    </span>
  );
}

function DiffTable({ entry }: { entry: AuditRow }) {
  const lines = diffLines(entry.diff?.before, entry.diff?.after);
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">No snapshot was recorded.</p>;
  }
  return (
    <Table containerClassName="rounded-lg border border-border">
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-40">Field</TableHead>
          <TableHead>Before</TableHead>
          <TableHead>After</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((l) => (
          <TableRow key={l.key} className={l.changed ? "bg-warning-soft/40" : undefined}>
            <TableCell className="font-mono text-xs">{l.key}</TableCell>
            <TableCell className="max-w-[24rem] font-mono text-xs break-words whitespace-pre-wrap">
              {l.before === null ? <span className="text-muted-foreground">—</span> : l.before}
            </TableCell>
            <TableCell className="max-w-[24rem] font-mono text-xs break-words whitespace-pre-wrap">
              {l.after === null ? <span className="text-muted-foreground">—</span> : l.after}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const sp = (await searchParams) as SearchParams;
  const db = getDb();
  const [session, settings] = await Promise.all([getAdminSession(), getSiteSettings()]);
  const isOwner = session?.adminUser.role === "owner";
  const entityType = one(sp, "entity");
  const action = one(sp, "action");
  const page = Math.max(1, Number.parseInt(one(sp, "page") ?? "1", 10) || 1);
  const selectedId = one(sp, "entry");

  const [list, entityTypes, selected] = db
    ? await Promise.all([
        listAuditEntries(db, { entityType, action, page, pageSize: PAGE_SIZE }),
        listAuditEntityTypes(db),
        selectedId ? getAuditEntry(db, selectedId) : Promise.resolve(null),
      ])
    : [{ rows: [], total: 0 }, [], null];
  const current: SearchParams = { entity: entityType, action, entry: selectedId };
  const revertCheck = selected ? checkRevertable(selected) : null;

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="Audit log"
        description="Every change made in the admin, by whom and when, with the before/after snapshot. Owners can revert a change with one click; the revert is logged too."
      />
      {!db ? <OfflineNote what="Entries" /> : null}

      {selected ? (
        <Panel
          title={`${selected.action}`}
          description={`${fmtDate(selected.createdAt, settings.timezone)} · ${selected.entityType}${selected.entityId ? ` · ${selected.entityId}` : ""}`}
          className="mb-6"
          actions={
            <Link href={buildHref(PATHNAME, current, { entry: undefined })} className="text-sm">
              ← Back to list
            </Link>
          }
          bodyClassName="flex flex-col gap-4"
        >
          <dl className="divide-y divide-border/70">
            <Fact label="Admin">{selected.adminUserId ?? "System / dev bypass"}</Fact>
            <Fact label="IP">{selected.ipAddress ?? "—"}</Fact>
            <Fact label="User agent">{selected.userAgent ?? "—"}</Fact>
          </dl>
          <DiffTable entry={selected} />
          <div className="flex flex-wrap items-center gap-3">
            {revertCheck?.ok ? (
              isOwner ? (
                <ActionForm
                  action={`/api/admin/audit/${selected.id}/revert`}
                  submitLabel={
                    revertCheck.mode === "delete"
                      ? `Revert: delete this ${revertCheck.entity.label.toLowerCase()}`
                      : revertCheck.mode === "insert"
                        ? `Revert: restore this ${revertCheck.entity.label.toLowerCase()}`
                        : `Revert to "before"`
                  }
                  confirm={`Revert this change? The ${revertCheck.entity.label.toLowerCase()} will be set back to its "before" state. This is logged.`}
                  variant="destructive"
                  size="sm"
                  inline
                  successMessage="Reverted. A new audit entry records the revert."
                  disabled={!db}
                />
              ) : (
                <p className="text-xs text-muted-foreground">Only an owner can revert changes.</p>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                Not revertable: {revertCheck?.reason ?? "no entry selected"}
              </p>
            )}
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Entries"
        description={`${list.total.toLocaleString("en")} recorded · revertable types: ${Object.keys(REVERTABLE_ENTITIES).join(", ")}`}
        bodyClassName="flex flex-col gap-4"
      >
        <form method="get" action={PATHNAME} className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Entity</span>
            <select
              name="entity"
              defaultValue={entityType ?? ""}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">All entities</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Action</span>
            <input
              type="search"
              name="action"
              defaultValue={action ?? ""}
              placeholder="services.update"
              className="h-9 w-56 rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </label>
          <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Filter
          </button>
          {entityType || action ? (
            <Link href={PATHNAME} className="text-xs text-muted-foreground">
              Clear
            </Link>
          ) : null}
        </form>

        {list.rows.length === 0 ? (
          <EmptyState
            title={db ? "No entries" : "Connect Supabase to see the audit log"}
            hint={
              db
                ? "Admin changes appear here as they are made."
                : "The audit log lives only in the database."
            }
          />
        ) : (
          <Table containerClassName="rounded-lg border border-border">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="hidden md:table-cell">Admin</TableHead>
                <TableHead className="text-right">Revert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.map((e, i) => {
                const check = checkRevertable(e);
                return (
                  <TableRow key={e.id} className={i % 2 ? "bg-muted/20" : undefined}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={buildHref(PATHNAME, current, { entry: e.id })}
                        className="text-sm"
                      >
                        {fmtDate(e.createdAt, settings.timezone)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <VerbPill action={e.action} />
                        <span className="font-mono text-xs">{e.action}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="block truncate font-mono text-xs" title={e.entityId ?? ""}>
                        {e.entityType}
                        {e.entityId ? ` · ${e.entityId.slice(0, 8)}…` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      {e.adminEmail ?? "system"}
                    </TableCell>
                    <TableCell className="text-right">
                      {check.ok ? (
                        <Link
                          href={buildHref(PATHNAME, current, { entry: e.id })}
                          className={buttonVariants({ variant: "gold-outline", size: "xs" })}
                        >
                          View &amp; revert
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground" title={check.reason}>
                          View only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <TablePagination
          pathname={PATHNAME}
          current={current}
          page={page}
          pageSize={PAGE_SIZE}
          total={list.total}
          label="entries"
        />
      </Panel>
    </>
  );
}
