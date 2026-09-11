import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Panel } from "@/components/admin/manage/panel";
import { buildHref, type SearchParams } from "@/components/admin/filters/search-params";
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
import { SEO_FINDING_SEVERITIES, type SeoFindingSeverity } from "@/db/schema/seo-health";
import { getAdminSession } from "@/lib/admin/auth";
import { getSeoHealthStore, type CrawlRow } from "@/lib/seo-health/store";
import { isSeoFindingType, SEO_FINDING_TYPE_LIST, SEO_FINDING_TYPES } from "@/lib/seo-health/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "SEO health" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/health";
const PAGE_SIZE = 50;

const SEVERITY_TONE: Record<SeoFindingSeverity, string> = {
  error: "bg-error-soft text-error",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

const STATUS_TONE: Record<CrawlRow["status"], string> = {
  running: "bg-info-soft text-info",
  paused: "bg-warning-soft text-warning",
  completed: "bg-success-soft text-success",
  failed: "bg-error-soft text-error",
};

function one(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

function fmtWhen(d: Date | null): string {
  return d
    ? d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) +
        " UTC"
    : "—";
}

function fmtDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
}

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase",
        tone,
      )}
    >
      {children}
    </span>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-accent-border/40 bg-card p-5 shadow-xs">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-sans text-2xl font-semibold text-foreground xl:text-3xl">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default async function HealthPage({ searchParams }: PageProps<"/admin/health">) {
  const sp = (await searchParams) as SearchParams;
  const store = getSeoHealthStore();
  const [crawls, session] = await Promise.all([store.listCrawls(10), getAdminSession()]);
  const canRun = session?.adminUser.role !== "viewer";
  const selectedId = one(sp, "crawl");
  const crawl = (selectedId && crawls.find((c) => c.id === selectedId)) || crawls[0] || null;

  const severityParam = one(sp, "severity");
  const severity = SEO_FINDING_SEVERITIES.find((s) => s === severityParam);
  const typeParam = one(sp, "type");
  const type = typeParam && isSeoFindingType(typeParam) ? typeParam : undefined;
  const path = one(sp, "path");
  const page = Math.max(1, Number.parseInt(one(sp, "page") ?? "1", 10) || 1);

  const [findings, counts] = crawl
    ? await Promise.all([
        store.listFindings(crawl.id, { severity, type, path, page, pageSize: PAGE_SIZE }),
        store.countFindings(crawl.id),
      ])
    : [{ rows: [], total: 0 }, null];

  const current: SearchParams = { crawl: selectedId, severity, type, path };

  return (
    <>
      <PageHeader
        eyebrow="SEO"
        title="Site health"
        description="A crawl of the live site from the home page, the route registry and the sitemaps: titles, descriptions, headings, links, images, structured data, citability, word counts, sitemap membership and redirects. Every finding links to the editor that fixes it."
        actions={
          canRun ? (
            <>
              {crawl?.status === "paused" ? (
                <ActionForm
                  action="/api/admin/seo-health/run"
                  submitLabel="Continue crawl"
                  variant="gold-outline"
                  size="sm"
                  inline
                  successMessage="Segment finished."
                />
              ) : null}
              <ActionForm
                action="/api/admin/seo-health/run"
                payload={{ fresh: true }}
                submitLabel={crawl ? "Run new crawl" : "Run crawl"}
                variant="gold"
                size="sm"
                inline
                successMessage="Crawl finished."
              />
            </>
          ) : null
        }
      />

      {!store.persistent ? (
        <p
          role="status"
          className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning"
        >
          Not connected to Supabase — crawl results are kept in server memory for this session only.
          Set <code>SUPABASE_DB_URL</code> to keep history and enable the weekly cron.
        </p>
      ) : null}

      {!crawl ? (
        <EmptyState
          title="No crawl yet"
          hint="Run the first crawl: it takes up to 45 seconds per segment and continues where it stopped. The weekly cron (Mondays 03:30 UTC) runs the same check."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Tile
              label="Pages crawled"
              value={crawl.pagesCrawled.toLocaleString("en")}
              hint={
                crawl.status === "paused"
                  ? `${(crawl.pagesDiscovered - crawl.pagesCrawled).toLocaleString("en")} queued`
                  : `${crawl.pagesDiscovered.toLocaleString("en")} discovered`
              }
            />
            <Tile label="Errors" value={String(counts?.bySeverity.error ?? 0)} />
            <Tile label="Warnings" value={String(counts?.bySeverity.warning ?? 0)} />
            <Tile label="Notes" value={String(counts?.bySeverity.info ?? 0)} />
            <Tile
              label="Citability"
              value={
                crawl.summary?.citabilityAverage !== undefined
                  ? `${crawl.summary.citabilityAverage}/100`
                  : "—"
              }
              hint="Average across crawled pages"
            />
          </div>

          <Panel
            title="Findings"
            description={`${crawl.origin} · started ${fmtWhen(crawl.startedAt)} · ${crawl.trigger}`}
            className="mb-6"
            actions={<Pill tone={STATUS_TONE[crawl.status]}>{crawl.status}</Pill>}
            bodyClassName="flex flex-col gap-4"
          >
            {crawl.error ? <p className="text-sm text-error">{crawl.error}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              {(["all", ...SEO_FINDING_SEVERITIES] as const).map((s) => {
                const active = s === "all" ? !severity : severity === s;
                const n = s === "all" ? counts?.total : counts?.bySeverity[s];
                return (
                  <Link
                    key={s}
                    href={buildHref(PATHNAME, current, {
                      severity: s === "all" ? undefined : s,
                      page: undefined,
                    })}
                    aria-current={active ? "page" : undefined}
                    className="rounded-full border border-border px-3 py-1 text-xs capitalize no-underline hover:border-accent-border aria-[current=page]:border-accent-strong aria-[current=page]:bg-accent"
                  >
                    {s === "all" ? "All" : s} {n !== undefined ? `(${n})` : ""}
                  </Link>
                );
              })}
            </div>
            <form method="get" action={PATHNAME} className="flex flex-wrap items-end gap-3 text-sm">
              {selectedId ? <input type="hidden" name="crawl" value={selectedId} /> : null}
              {severity ? <input type="hidden" name="severity" value={severity} /> : null}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Type</span>
                <select
                  name="type"
                  defaultValue={type ?? ""}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">All types</option>
                  {SEO_FINDING_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {SEO_FINDING_TYPES[t].label}
                      {counts?.byType[t] ? ` (${counts.byType[t]})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Path</span>
                <input
                  type="search"
                  name="path"
                  defaultValue={path ?? ""}
                  placeholder="/astrologer/india"
                  className="h-9 w-56 rounded-md border border-input bg-transparent px-2 text-sm"
                />
              </label>
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Filter
              </button>
              {type || path ? (
                <Link
                  href={buildHref(PATHNAME, current, {
                    type: undefined,
                    path: undefined,
                    page: undefined,
                  })}
                  className="text-xs text-muted-foreground"
                >
                  Clear
                </Link>
              ) : null}
            </form>

            {findings.rows.length === 0 ? (
              <EmptyState
                title={counts?.total ? "No findings match these filters" : "No findings"}
                hint={
                  counts?.total
                    ? "Widen the filters above."
                    : crawl.status === "completed"
                      ? "Every crawled page passed every check."
                      : "Findings appear as the crawl progresses."
                }
              />
            ) : (
              <Table containerClassName="rounded-lg border border-border">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Finding</TableHead>
                    <TableHead className="text-right">Fix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {findings.rows.map((f, i) => (
                    <TableRow key={f.id} className={i % 2 ? "bg-muted/20" : undefined}>
                      <TableCell>
                        <Pill tone={SEVERITY_TONE[f.severity]}>{f.severity}</Pill>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          title={isSeoFindingType(f.type) ? SEO_FINDING_TYPES[f.type].hint : ""}
                        >
                          {isSeoFindingType(f.type) ? SEO_FINDING_TYPES[f.type].label : f.type}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[16rem]">
                        <a
                          href={`${crawl.origin}${f.path}`}
                          target="_blank"
                          rel="noopener"
                          className="block truncate font-mono text-xs"
                          title={f.path}
                        >
                          {f.path}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[28rem] whitespace-normal">
                        <span className="line-clamp-2 text-sm" title={f.message}>
                          {f.message}
                        </span>
                        {Array.isArray(f.details?.fixes) && f.details.fixes.length > 0 ? (
                          <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                            {(f.details.fixes as string[]).slice(0, 3).map((fix) => (
                              <li key={fix}>{fix}</li>
                            ))}
                          </ul>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {f.fixHref ? (
                          <Link
                            href={f.fixHref}
                            className={buttonVariants({ variant: "gold-outline", size: "xs" })}
                          >
                            Open editor
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">In code</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <TablePagination
              pathname={PATHNAME}
              current={current}
              page={page}
              pageSize={PAGE_SIZE}
              total={findings.total}
              label="findings"
            />
          </Panel>
        </>
      )}

      {crawls.length > 0 ? (
        <Panel title="Crawl runs" description="The last ten runs. Select one to view its findings.">
          <Table containerClassName="rounded-lg border border-border">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Started</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pages</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead className="text-right">Warnings</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crawls.map((c) => (
                <TableRow key={c.id} className={c.id === crawl?.id ? "bg-accent/40" : undefined}>
                  <TableCell>
                    <Link href={buildHref(PATHNAME, {}, { crawl: c.id })} className="text-sm">
                      {fmtWhen(c.startedAt)}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{c.trigger}</TableCell>
                  <TableCell>
                    <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.pagesCrawled}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.summary?.bySeverity.error ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.summary?.bySeverity.warning ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtDuration(c.elapsedMs)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      ) : null}
    </>
  );
}
