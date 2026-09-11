/**
 * `/admin/traffic` — the four core metrics as small multiples against the previous period
 * (never a dual axis), plus the source breakdown table.
 */
import type { Metadata } from "next";
import { LineChart, StatTile } from "@/components/admin/charts";
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
import { pageWindow } from "@/components/admin/filters/search-params";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { metricColumns, sortSpecFrom } from "@/components/admin/tables/metric-columns";
import { PAGE_SIZE, TablePagination } from "@/components/admin/tables/pagination";
import {
  getBreakdown,
  getOverview,
  getTimeseries,
  type MetricRow,
  type TimeseriesMetric,
} from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Traffic" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/traffic";
const METRICS: {
  metric: TimeseriesMetric;
  title: string;
  unit: string;
  format?: (v: number) => string;
}[] = [
  { metric: "visitors", title: "Visitors", unit: "Visitors" },
  { metric: "sessions", title: "Sessions", unit: "Sessions" },
  { metric: "pageviews", title: "Pageviews", unit: "Pageviews" },
  { metric: "bounceRate", title: "Bounce rate", unit: "%", format: (v) => `${v.toFixed(1)}%` },
];

export default async function TrafficPage({ searchParams }: PageProps<"/admin/traffic">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const range = rangeOf(ctx);
  const granularity = granularityFor(params.range.days);
  const sort = sortSpecFrom(params.sort, params.dir);
  const [overview, series, sources] = await Promise.all([
    getOverview({ ...range, compare: true, geo: params.geo }),
    Promise.all(
      METRICS.map(async (m) => {
        const [cur, prev] = await Promise.all([
          getTimeseries({ ...range, granularity, metric: m.metric, geo: params.geo }),
          getTimeseries({ ...previousOf(ctx), granularity, metric: m.metric, geo: params.geo }),
        ]);
        return { ...m, cur, prev };
      }),
    ),
    getBreakdown({ ...range, dim: "source", sort, ...pageWindow(params.page, PAGE_SIZE) }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Traffic"
        description="Visitors, sessions, pageviews and bounce rate over time."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="tiles and trends honour the location filter; the source table shows the whole site"
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Visitors"
          value={formatNumber(overview.current.visitors)}
          delta={deltaRatio(overview.deltas?.visitors)}
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
          label="Avg. session"
          value={formatDuration(overview.current.avgDurationMs)}
          delta={deltaRatio(overview.deltas?.avgDurationMs)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {series.map((m) => (
          <LineChart
            key={m.metric}
            title={m.title}
            description={`${m.title} per ${granularity}, current range against the previous period.`}
            unit={m.unit}
            height={200}
            format={m.format}
            series={[
              { name: m.title, points: m.cur.map((p) => ({ x: p.period, y: p.value })) },
              {
                name: "Previous period",
                points: m.cur.map((p, i) => ({ x: p.period, y: m.prev[i]?.value ?? 0 })),
              },
            ]}
          />
        ))}
      </div>

      <section aria-labelledby="sources" className="flex flex-col gap-3">
        <h2 id="sources" className="font-serif text-xl">
          Sessions by source
        </h2>
        <DataTable<MetricRow & { share: number }>
          caption="Sessions by source"
          pathname={PATHNAME}
          current={sp}
          sort={sort.by}
          dir={sort.dir}
          rows={sources.rows}
          rowKey={(r) => r.key}
          emptyText={connected ? "No sessions in this range." : "Connect Supabase to see sources."}
          columns={metricColumns("Source", (r) => (
            <span>
              {r.label} <span className="text-xs text-muted-foreground">{r.share.toFixed(1)}%</span>
            </span>
          ))}
        />
        <TablePagination
          pathname={PATHNAME}
          current={sp}
          page={params.page}
          total={sources.total}
          label="sources"
        />
      </section>
    </div>
  );
}
