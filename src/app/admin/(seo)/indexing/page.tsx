/**
 * `/admin/indexing` — how the site is doing in search, beside the first-party numbers.
 *
 * Google Search Console and Bing Webmaster are read through `src/lib/search-console` using the
 * credentials stored in Integrations; each provider states plainly when it is not connected
 * rather than showing zeroes. Provider answers are cached for an hour. The same screen submits
 * URLs to IndexNow (which matters for Bing and therefore for ChatGPT's search layer) and shows
 * every submission the site has made.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDateTime } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Field, Panel } from "@/components/admin/manage/panel";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { SEARCH_TOOLS_NAV } from "@/components/admin/redirects/nav";
import { Button } from "@/components/ui/button";
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
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";
import { listIndexNowLog } from "@/lib/redirects/indexnow-log";
import { getSearchPerformance, type ProviderPerformance } from "@/lib/search-console";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Indexing" };
export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "28", label: "Last 28 days", days: 28 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

function rangeFor(days: number): { from: string; to: string } {
  const to = new Date();
  // Search Console data lags ~2 days; ending "yesterday" avoids a misleading empty tail.
  to.setUTCDate(to.getUTCDate() - 1);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

const num = (n: number) => n.toLocaleString("en");
const pos = (n: number | null) => (n === null ? "—" : n.toFixed(1));

export default async function IndexingPage({ searchParams }: PageProps<"/admin/indexing">) {
  const params = await searchParams;
  const selected = RANGES.find((r) => r.key === params.range) ?? RANGES[1];
  const range = rangeFor(selected.days);
  const [performance, log, settings, session] = await Promise.all([
    getSearchPerformance(range, { limit: 100 }),
    listIndexNowLog(25),
    getSiteSettings(),
    getAdminSession(),
  ]);
  const canEdit = session?.adminUser.role !== "viewer";
  const { google, bing } = performance;

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Indexing & search performance"
        description={`Google Search Console and Bing Webmaster beside this site's own pageviews, ${range.from} to ${range.to}. Provider figures are cached for an hour.`}
        actions={
          canEdit ? (
            <ActionForm
              action="/api/admin/indexnow/performance"
              method="POST"
              inline
              size="sm"
              variant="outline"
              submitLabel="Refresh from providers"
              successMessage="Cache cleared. Reload the page to pull fresh figures."
            />
          ) : null
        }
      />
      <SubNav items={SEARCH_TOOLS_NAV} current="/admin/indexing" label="Search tools" />

      <nav aria-label="Date range" className="mb-6">
        <ul className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <li key={r.key}>
              <Link
                href={`/admin/indexing?range=${r.key}`}
                aria-current={r.key === selected.key ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium no-underline transition-colors",
                  r.key === selected.key
                    ? "border-accent-border bg-accent text-accent-foreground"
                    : "border-border text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-4 md:grid-cols-2">
        <ProviderCard
          title="Google Search Console"
          provider={google}
          timezone={settings.timezone}
        />
        <ProviderCard title="Bing Webmaster Tools" provider={bing} timezone={settings.timezone} />
      </div>

      <h2 className="mt-8 mb-3 font-serif text-xl font-medium">Pages</h2>
      {performance.rows.length === 0 ? (
        <EmptyState
          title="Nothing to show yet"
          hint="Connect Google Search Console or Bing in Integrations, or wait for this site's own analytics to record pageviews in the selected range."
        />
      ) : (
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Google clicks</TableHead>
              <TableHead className="hidden text-right md:table-cell">Impressions</TableHead>
              <TableHead className="hidden text-right md:table-cell">CTR</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Position</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Bing clicks</TableHead>
              <TableHead className="text-right">Pageviews</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.rows.map((row, i) => (
              <TableRow key={row.path} className={i % 2 ? "bg-muted/20" : undefined}>
                <TableCell className="max-w-[24rem] font-mono text-xs break-all whitespace-normal">
                  {row.path}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.google ? num(row.google.clicks) : "—"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">
                  {row.google ? num(row.google.impressions) : "—"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">
                  {row.google ? `${row.google.ctr}%` : "—"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {row.google ? pos(row.google.position) : "—"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {row.bing ? num(row.bing.clicks) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.pageviews ? num(row.pageviews) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Queries title="Top Google queries" provider={google} />
        <Queries title="Top Bing queries" provider={bing} />
      </div>

      <h2 className="mt-8 mb-3 font-serif text-xl font-medium">IndexNow</h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel
          title="Submit URLs"
          description="IndexNow tells Bing (and therefore ChatGPT's search layer) about a change immediately. Paste URLs or pick a date and everything changed since is sent."
        >
          <ActionForm
            action="/api/admin/indexnow"
            method="POST"
            submitLabel="Submit to IndexNow"
            disabled={!canEdit}
            successMessage="Submitted. The result is logged below."
          >
            <Field label="URLs" htmlFor="in-urls" hint="One per line; site paths or full URLs.">
              <Textarea
                id="in-urls"
                name="urls"
                rows={6}
                spellCheck={false}
                placeholder={"/astrologer/india/maharashtra/mumbai\n/services/integrated-reading"}
                className="font-mono text-xs"
              />
            </Field>
            <Field
              label="…or everything changed since"
              htmlFor="in-since"
              hint="Every sitemap URL whose lastmod is on or after this date."
            >
              <Input id="in-since" name="since" type="date" />
            </Field>
          </ActionForm>
        </Panel>
        <Panel
          title="Submission log"
          description="Every IndexNow call this site has made, newest first."
        >
          {log.length === 0 ? (
            <EmptyState
              title="Nothing submitted yet"
              hint="Slug changes and SEO saves submit automatically once INDEXNOW_KEY is set and the database is connected."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block text-sm">
                      {entry.urls.length} URL{entry.urls.length === 1 ? "" : "s"} · {entry.trigger}
                    </span>
                    <span className="block font-mono text-xs break-all text-muted-foreground">
                      {entry.urls.slice(0, 2).join(", ")}
                      {entry.urls.length > 2 ? ` +${entry.urls.length - 2} more` : ""}
                    </span>
                    {entry.response ? (
                      <span className="block text-xs text-muted-foreground">{entry.response}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={entry.status} />
                    <span className="text-xs text-muted-foreground">
                      {fmtDateTime(entry.createdAt, settings.timezone)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: "submitted" | "skipped" | "failed" }) {
  const tone =
    status === "submitted"
      ? "border-success/40 bg-success-soft text-success"
      : status === "failed"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-medium capitalize",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function ProviderCard({
  title,
  provider,
  timezone,
}: {
  title: string;
  provider: ProviderPerformance;
  timezone: string;
}) {
  const connected = provider.state === "ok";
  return (
    <section className="rounded-xl border border-accent-border/40 bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-medium">{title}</h2>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-medium",
            connected
              ? "border-success/40 bg-success-soft text-success"
              : provider.state === "error"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-muted text-muted-foreground",
          )}
        >
          {connected ? "Connected" : provider.state === "error" ? "Error" : "Not connected"}
        </span>
      </div>
      {connected ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Clicks" value={num(provider.totals.clicks)} />
            <Metric label="Impressions" value={num(provider.totals.impressions)} />
            <Metric label="CTR" value={`${provider.totals.ctr}%`} />
            <Metric label="Position" value={pos(provider.totals.position)} />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            {provider.fetchedAt
              ? `${provider.cached ? "Cached" : "Fetched"} ${fmtDateTime(new Date(provider.fetchedAt), timezone)}`
              : null}
            {provider.provider === "bing"
              ? " · Bing reports its own trailing window rather than the range above."
              : null}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">{provider.message ?? "No data."}</p>
          <Button asChild variant="gold-outline" size="sm" className="mt-4">
            <Link href="/admin/integrations">Open Integrations</Link>
          </Button>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Queries({ title, provider }: { title: string; provider: ProviderPerformance }) {
  return (
    <Panel title={title} description="What people typed before they saw this site.">
      {provider.state !== "ok" ? (
        <EmptyState title="Not connected" hint={provider.message ?? undefined} />
      ) : provider.queries.length === 0 ? (
        <EmptyState title="No queries recorded" hint="Nothing in this range yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Impressions</TableHead>
              <TableHead className="text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {provider.queries.slice(0, 15).map((q, i) => (
              <TableRow key={q.query} className={i % 2 ? "bg-muted/20" : undefined}>
                <TableCell className="max-w-[18rem] break-words whitespace-normal">
                  {q.query}
                </TableCell>
                <TableCell className="text-right tabular-nums">{num(q.clicks)}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {num(q.impressions)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{pos(q.position)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
