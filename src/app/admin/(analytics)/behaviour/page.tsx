/**
 * `/admin/behaviour` — scroll-depth heat strip per page, the click heatmap overlay for one page
 * (`?path=`), rage / dead click reports and the scroll-vs-conversion table. Click data comes
 * from raw events, so it only covers the retention window.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ClickHeatmap, HeatStrip, StatTile, type HeatStripRow } from "@/components/admin/charts";
import { formatNumber } from "@/components/admin/charts/tokens";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { NOT_CONNECTED_TEXT, panelContext, rangeOf } from "@/components/admin/filters/panel";
import { buildHref } from "@/components/admin/filters/search-params";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { cn } from "@/lib/utils";
import { getBehaviour, getPages, type PageRow } from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Behaviour" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/behaviour";

export default async function BehaviourPage({ searchParams }: PageProps<"/admin/behaviour">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const range = rangeOf(ctx);
  const [pages, report] = await Promise.all([
    getPages({ ...range, kind: "top", limit: 12 }),
    getBehaviour({ ...range, path: params.path ?? null }),
  ]);
  const strip: HeatStripRow[] = pages.rows.slice(0, 8).map((r) => ({
    label: r.path,
    pageviews: r.pageviews,
    reached: [25, 50, 75, 90, 100].map(
      (d) => (r.scroll.find((s) => s.depth === d)?.pct ?? 0) / 100,
    ) as HeatStripRow["reached"],
  }));
  const scope = params.path ?? "the whole site";

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Behaviour"
        description="How far people scroll, where they click, and where clicks go wrong."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="behaviour data is site-wide"
      />

      <section aria-label="Page" className="flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-1 text-xs text-muted-foreground">Page:</span>
        <PathChip href={buildHref(PATHNAME, sp, { path: undefined })} active={!params.path}>
          Whole site
        </PathChip>
        {pages.rows.map((r) => (
          <PathChip
            key={r.path}
            href={buildHref(PATHNAME, sp, { path: r.path })}
            active={params.path === r.path}
          >
            {r.path}
          </PathChip>
        ))}
        <form method="get" action={PATHNAME} className="flex items-center gap-1">
          {Object.entries(sp)
            .filter(([k, v]) => k !== "path" && typeof v === "string")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v as string} />
            ))}
          <label className="sr-only" htmlFor="behaviour-path">
            Any path
          </label>
          <input
            id="behaviour-path"
            name="path"
            placeholder="/any/path"
            defaultValue={params.path ?? ""}
            className="h-8 w-40 rounded-md border border-input bg-transparent px-2 font-mono text-xs"
          />
          <button type="submit" className="h-8 rounded-md border border-border px-2 text-xs">
            Go
          </button>
        </form>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Clicks" value={formatNumber(report.clicks)} delta={null} compareLabel="" />
        <StatTile label="Rage clicks" value={formatNumber(report.rageClicks)} delta={null} />
        <StatTile label="Dead clicks" value={formatNumber(report.deadClicks)} delta={null} />
        <StatTile label="Form abandons" value={formatNumber(report.formAbandons)} delta={null} />
      </div>
      <p className="text-xs text-muted-foreground">
        Click and form data for {scope} from raw events, which are kept for {report.retentionDays}{" "}
        days; scroll depth comes from the daily rollups and covers the whole range.
      </p>

      {params.path ? (
        <section aria-labelledby="heatmap" className="flex flex-col gap-3">
          <h2 id="heatmap" className="font-serif text-xl">
            Click heatmap — {params.path}
          </h2>
          {report.heat.total > 0 ? (
            <ClickHeatmap
              path={params.path}
              cols={report.heat.cols}
              rows={report.heat.rows}
              cells={report.heat.cells}
              totalClicks={report.heat.total}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No clicks recorded on {params.path} in the retention window.
            </p>
          )}
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Choose a page above to see its click heatmap over the live page.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ClickTable
          title="Rage clicks"
          help="Three or more clicks within 700 ms on the same spot — usually something that looks clickable but does nothing fast."
          rows={report.topRage}
          connected={connected}
        />
        <ClickTable
          title="Dead clicks"
          help="Clicks on non-interactive elements that changed nothing on the page."
          rows={report.topDead}
          connected={connected}
        />
      </div>

      <HeatStrip
        title="Scroll depth by page"
        description="Share of pageviews that reached each scroll mark, for the top pages in the range."
        rows={strip}
        emptyText={
          connected ? "No scroll data in this range." : "Connect Supabase to see scroll depth."
        }
      />

      <section aria-labelledby="scroll-conv" className="flex flex-col gap-3">
        <h2 id="scroll-conv" className="font-serif text-xl">
          Scroll depth vs conversion
        </h2>
        <DataTable<PageRow>
          caption="Scroll depth vs conversion"
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
                <Link
                  href={buildHref(PATHNAME, sp, { path: r.path })}
                  className="font-mono text-xs"
                >
                  {r.path}
                </Link>
              ),
            },
            {
              key: "pageviews",
              label: "Pageviews",
              align: "right",
              render: (r) => formatNumber(r.pageviews),
            },
            {
              key: "s50",
              label: "Reached 50%",
              align: "right",
              render: (r) => `${(r.scroll.find((s) => s.depth === 50)?.pct ?? 0).toFixed(0)}%`,
            },
            {
              key: "s90",
              label: "Reached 90%",
              align: "right",
              render: (r) => `${(r.scroll.find((s) => s.depth === 90)?.pct ?? 0).toFixed(0)}%`,
            },
            {
              key: "conversions",
              label: "Conversions",
              align: "right",
              render: (r) => formatNumber(r.conversions),
            },
            {
              key: "conversionRate",
              label: "Conv. rate",
              align: "right",
              render: (r) => `${r.conversionRate.toFixed(1)}%`,
            },
          ]}
        />
      </section>
    </div>
  );
}

function PathChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-8 max-w-56 items-center truncate rounded-md border px-2 font-mono text-xs no-underline",
        active
          ? "border-accent-border bg-accent text-accent-foreground"
          : "border-border text-foreground/80 hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

function ClickTable({
  title,
  help,
  rows,
  connected,
}: {
  title: string;
  help: string;
  rows: { selector: string; text: string; count: number }[];
  connected: boolean;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="text-xs text-muted-foreground">{help}</p>
      <DataTable<{ selector: string; text: string; count: number }>
        caption={title}
        pathname={PATHNAME}
        current={{}}
        rows={rows}
        rowKey={(r, i) => `${r.selector}-${i}`}
        emptyText={connected ? "None recorded — good." : "Connect Supabase to see click reports."}
        columns={[
          {
            key: "selector",
            label: "Element",
            render: (r) => <code className="text-xs">{r.selector}</code>,
          },
          {
            key: "text",
            label: "Text",
            render: (r) => <span className="text-xs text-muted-foreground">{r.text || "–"}</span>,
          },
          { key: "count", label: "Count", align: "right", render: (r) => formatNumber(r.count) },
        ]}
      />
    </section>
  );
}
