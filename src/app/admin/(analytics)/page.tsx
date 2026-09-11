/**
 * `/admin` — overview: six comparison tiles, visitors against the previous period, top
 * countries and pages, and the geo-page performance table with zero-traffic rows highlighted.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart, LineChart, StatTile } from "@/components/admin/charts";
import { formatDuration, formatNumber } from "@/components/admin/charts/tokens";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import {
  deltaRatio,
  granularityFor,
  NOT_CONNECTED_TEXT,
  panelContext,
  previousOf,
  rangeOf,
} from "@/components/admin/filters/panel";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { PAGE_SIZE, TablePagination } from "@/components/admin/tables/pagination";
import {
  getBreakdown,
  getGeoPagePerformance,
  getOverview,
  getPages,
  getTimeseries,
  type GeoPagePerformanceRow,
} from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin";
const GEO_SORT_KEYS = [
  "locationName",
  "pageviews",
  "visitors",
  "sessions",
  "conversions",
  "bookings",
] as const;

export default async function AdminOverviewPage({ searchParams }: PageProps<"/admin">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const range = rangeOf(ctx);
  const granularity = granularityFor(params.range.days);
  const [overview, current, previous, countries, pages, geoPages] = await Promise.all([
    getOverview({ ...range, compare: true, geo: params.geo }),
    getTimeseries({ ...range, granularity, metric: "visitors", geo: params.geo }),
    getTimeseries({ ...previousOf(ctx), granularity, metric: "visitors", geo: params.geo }),
    getBreakdown({ ...range, dim: "country", limit: 8 }),
    getPages({ ...range, kind: "top", limit: 8 }),
    getGeoPagePerformance(range),
  ]);

  const sortKey = (GEO_SORT_KEYS as readonly string[]).includes(params.sort ?? "")
    ? (params.sort as (typeof GEO_SORT_KEYS)[number])
    : "pageviews";
  const sortedGeo = [...geoPages.rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return params.sort ? (params.dir === "asc" ? cmp : -cmp) : b.pageviews - a.pageviews;
  });
  const pageRows = sortedGeo.slice((params.page - 1) * PAGE_SIZE, params.page * PAGE_SIZE);
  const denied = sp.denied === "1";
  const nameOf = new Map(geoOptions.countries.map((c) => [c.code, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader title="Overview" description="How the practice website is doing, at a glance." />
      {denied ? (
        <p role="alert" className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
          Your role does not allow that page.
        </p>
      ) : null}
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="tiles and the trend honour the location filter; breakdown charts show the whole site"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Visitors"
          value={formatNumber(overview.current.visitors)}
          delta={deltaRatio(overview.deltas?.visitors)}
          trend={current.map((p) => p.value)}
        />
        <StatTile
          label="Sessions"
          value={formatNumber(overview.current.sessions)}
          delta={deltaRatio(overview.deltas?.sessions)}
        />
        <StatTile
          label="Pageviews"
          value={formatNumber(overview.current.pageviews)}
          delta={deltaRatio(overview.deltas?.pageviews)}
        />
        <StatTile
          label="Bounce rate"
          value={`${overview.current.bounceRate.toFixed(1)}%`}
          delta={deltaRatio(overview.deltas?.bounceRate)}
          upIsGood={false}
        />
        <StatTile
          label="Avg. session"
          value={formatDuration(overview.current.avgDurationMs)}
          delta={deltaRatio(overview.deltas?.avgDurationMs)}
        />
        <StatTile
          label="Conversions"
          value={formatNumber(overview.current.conversions)}
          delta={deltaRatio(overview.deltas?.conversions)}
        />
      </div>

      <LineChart
        title="Visitors over time"
        description={`Unique visitors per ${granularity} for ${params.range.from} to ${params.range.to}, with the previous period for comparison.`}
        unit="Visitors"
        series={[
          { name: "Visitors", points: current.map((p) => ({ x: p.period, y: p.value })) },
          {
            name: "Previous period",
            points: current.map((p, i) => ({ x: p.period, y: previous[i]?.value ?? 0 })),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          title="Top countries"
          description="Countries by unique visitors in the selected range."
          unit="Visitors"
          data={countries.rows.map((r) => ({
            label: nameOf.get(r.key) ?? r.label,
            value: r.visitors,
            hint: `${r.share.toFixed(1)}% of visitors`,
          }))}
        />
        <BarChart
          title="Top pages"
          description="Pages by pageviews in the selected range."
          unit="Pageviews"
          data={pages.rows.map((r) => ({ label: r.path, value: r.pageviews }))}
        />
      </div>

      <section aria-labelledby="geo-pages" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="geo-pages" className="font-serif text-xl">
            Geo page performance
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatNumber(geoPages.totalPages)} published geo pages ·{" "}
            <span className={geoPages.zeroTrafficPages > 0 ? "text-warning" : undefined}>
              {formatNumber(geoPages.zeroTrafficPages)} with zero traffic
            </span>{" "}
            (highlighted)
          </p>
        </div>
        <DataTable<GeoPagePerformanceRow>
          caption="Geo page performance"
          pathname={PATHNAME}
          current={sp}
          sort={params.sort ?? "pageviews"}
          dir={params.sort ? params.dir : "desc"}
          rows={pageRows}
          rowKey={(r) => r.href}
          highlight={(r) => r.zeroTraffic}
          emptyText={
            connected ? "No geo pages published yet." : "Connect Supabase to see page traffic."
          }
          columns={[
            {
              key: "locationName",
              label: "Page",
              sortable: true,
              render: (r) => (
                <span className="flex flex-col">
                  <Link href={r.href} className="text-foreground">
                    {r.locationName}
                    <span className="text-muted-foreground">
                      {" "}
                      · {r.service === "astrologer" ? "Astrologer" : "Vastu"}
                    </span>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {r.status === "partial" ? "noindex (partial research)" : "indexable"}
                  </span>
                </span>
              ),
            },
            {
              key: "pageviews",
              label: "Pageviews",
              align: "right",
              sortable: true,
              render: (r) => formatNumber(r.pageviews),
            },
            {
              key: "visitors",
              label: "Visitors",
              align: "right",
              sortable: true,
              render: (r) => formatNumber(r.visitors),
            },
            {
              key: "sessions",
              label: "Sessions",
              align: "right",
              sortable: true,
              render: (r) => formatNumber(r.sessions),
            },
            {
              key: "conversions",
              label: "Conversions",
              align: "right",
              sortable: true,
              render: (r) => formatNumber(r.conversions),
            },
            {
              key: "bookings",
              label: "Bookings",
              align: "right",
              sortable: true,
              render: (r) => formatNumber(r.bookings),
            },
          ]}
        />
        <TablePagination
          pathname={PATHNAME}
          current={sp}
          page={params.page}
          total={sortedGeo.length}
          label="pages"
        />
      </section>
    </div>
  );
}
