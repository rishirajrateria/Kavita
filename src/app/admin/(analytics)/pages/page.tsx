/**
 * `/admin/pages` — top / entry / exit pages with time on page, exit rate, scroll depth and
 * conversions; paginated; each row links to the live page and to its behaviour report.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/admin/charts";
import { formatDuration, formatNumber } from "@/components/admin/charts/tokens";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { NOT_CONNECTED_TEXT, panelContext, rangeOf } from "@/components/admin/filters/panel";
import { buildHref, pageWindow } from "@/components/admin/filters/search-params";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { PAGE_SIZE, TablePagination } from "@/components/admin/tables/pagination";
import { cn } from "@/lib/utils";
import { getPages, type PageRow, type PagesKind } from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Pages" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/pages";
const KINDS: { kind: PagesKind; label: string; help: string }[] = [
  { kind: "top", label: "Top pages", help: "by pageviews" },
  { kind: "entry", label: "Entry pages", help: "where sessions start" },
  { kind: "exit", label: "Exit pages", help: "where sessions end" },
];

export default async function PagesPage({ searchParams }: PageProps<"/admin/pages">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const kind: PagesKind = KINDS.some((k) => k.kind === params.kind)
    ? (params.kind as PagesKind)
    : "top";
  const pages = await getPages({ ...rangeOf(ctx), kind, ...pageWindow(params.page, PAGE_SIZE) });
  const metric = kind === "entry" ? "entries" : kind === "exit" ? "exits" : "pageviews";

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Pages"
        description="What people read, where they arrive and where they leave."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="page metrics are site-wide; use Geography for location splits"
      >
        <ul className="flex flex-wrap gap-1" aria-label="Page kind">
          {KINDS.map((k) => (
            <li key={k.kind}>
              <Link
                href={buildHref(PATHNAME, sp, {
                  kind: k.kind === "top" ? undefined : k.kind,
                  page: undefined,
                })}
                aria-current={kind === k.kind ? "true" : undefined}
                title={k.help}
                className={cn(
                  "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium no-underline",
                  kind === k.kind
                    ? "border-accent-border bg-accent text-accent-foreground"
                    : "border-border text-foreground/80 hover:bg-muted",
                )}
              >
                {k.label}
              </Link>
            </li>
          ))}
        </ul>
      </FilterBar>

      <BarChart
        title={KINDS.find((k) => k.kind === kind)?.label ?? "Pages"}
        description={`Pages ranked by ${metric} in the selected range.`}
        unit={metric === "pageviews" ? "Pageviews" : metric === "entries" ? "Entries" : "Exits"}
        data={pages.rows.slice(0, 10).map((r) => ({ label: r.path, value: r[metric] }))}
        emptyText={connected ? "No pageviews in this range." : "Connect Supabase to see pages."}
      />

      <DataTable<PageRow>
        caption="Pages"
        pathname={PATHNAME}
        current={sp}
        rows={pages.rows}
        rowKey={(r) => r.path}
        emptyText={connected ? "No pageviews in this range." : "Connect Supabase to see pages."}
        columns={[
          {
            key: "path",
            label: "Page",
            render: (r) => (
              <span className="flex flex-col">
                <Link
                  href={r.path}
                  className="font-mono text-xs text-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.path}
                </Link>
                <Link
                  href={buildHref("/admin/behaviour", sp, {
                    path: r.path,
                    page: undefined,
                    kind: undefined,
                  })}
                  className="text-xs text-muted-foreground"
                >
                  Behaviour report ›
                </Link>
              </span>
            ),
          },
          {
            key: "pageviews",
            label: "Pageviews",
            align: "right",
            render: (r) => formatNumber(r.pageviews),
          },
          {
            key: "visitors",
            label: "Visitors",
            align: "right",
            render: (r) => formatNumber(r.visitors),
          },
          {
            key: "entries",
            label: "Entries",
            align: "right",
            render: (r) => formatNumber(r.entries),
          },
          {
            key: "exitRate",
            label: "Exit rate",
            align: "right",
            render: (r) => `${r.exitRate.toFixed(1)}%`,
          },
          {
            key: "avgDurationMs",
            label: "Time on page",
            align: "right",
            render: (r) => formatDuration(r.avgDurationMs),
          },
          {
            key: "scroll75",
            label: "Reached 75%",
            align: "right",
            render: (r) => `${(r.scroll.find((s) => s.depth === 75)?.pct ?? 0).toFixed(0)}%`,
          },
          {
            key: "conversions",
            label: "Conversions",
            align: "right",
            render: (r) => formatNumber(r.conversions),
          },
        ]}
      />
      <TablePagination
        pathname={PATHNAME}
        current={sp}
        page={params.page}
        total={pages.total}
        label="pages"
      />
    </div>
  );
}
