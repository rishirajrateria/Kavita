/**
 * `/admin/preview` — design review of every chart component from a static fixture. Not routable
 * in production (`notFound()`), never linked from the nav; exists so the visual pass can be done
 * offline where the analytics tables are empty. (`_preview` would be a private folder in the
 * App Router, hence the name.)
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BarChart,
  ClickHeatmap,
  DotMap,
  FunnelChart,
  HeatStrip,
  LineChart,
  StackedBarChart,
  StatTile,
} from "@/components/admin/charts";
import {
  FIXTURE_COUNTRIES,
  FIXTURE_DEVICES,
  FIXTURE_FUNNEL,
  FIXTURE_HEAT,
  FIXTURE_MAP,
  FIXTURE_SCROLL,
  FIXTURE_STATS,
  FIXTURE_TIMESERIES,
  FIXTURE_WEEKS,
} from "@/components/admin/charts/fixture";
import { DataTable } from "@/components/admin/tables/data-table";
import { TablePagination } from "@/components/admin/tables/pagination";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { parsePanelParams } from "@/components/admin/filters/search-params";
import { PanelHeader } from "@/components/admin/shell/panel-header";

export const metadata: Metadata = { title: "Chart preview" };
export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: PageProps<"/admin/preview">) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const params = parsePanelParams(sp);
  const rows = FIXTURE_COUNTRIES.map((c, i) => ({
    country: c.label,
    visitors: c.value,
    sessions: Math.round(c.value * 1.24),
    pageviews: Math.round(c.value * 3.4),
    bounce: 0.31 + (i % 4) * 0.04,
    zero: i === 7,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Chart preview"
        description="Synthetic fixture data for design review only. Not real analytics."
      />
      <FilterBar
        pathname="/admin/preview"
        current={sp}
        params={params}
        geoOptions={{
          countries: [
            { code: "IN", name: "India" },
            { code: "US", name: "United States" },
            { code: "AE", name: "United Arab Emirates" },
          ],
          regions: ["Maharashtra", "Delhi"],
          cities: ["Mumbai", "Pune"],
        }}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {FIXTURE_STATS.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>
      <LineChart
        title="Visitors over time"
        description="Daily unique visitors for the selected range against the previous period."
        series={FIXTURE_TIMESERIES}
        unit="Visitors"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          title="Visitors by country"
          description="Top countries by unique visitors in the selected range."
          data={FIXTURE_COUNTRIES}
          unit="Visitors"
        />
        <StackedBarChart
          title="Sessions by device"
          description="Weekly sessions split by device type."
          categories={FIXTURE_WEEKS}
          series={FIXTURE_DEVICES}
          unit="Sessions"
          formatCategory={(c) => c.replace("2026-", "")}
        />
      </div>
      <DotMap
        title="Where visitors are"
        description="Visitors by city, dot area proportional to visitors."
        dots={FIXTURE_MAP}
        unmatched={[{ name: "Unknown, IN", visitors: 88 }]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <HeatStrip
          title="Scroll depth by page"
          description="Share of pageviews reaching each scroll mark, per page."
          rows={FIXTURE_SCROLL}
        />
        <FunnelChart
          title="Booking funnel"
          description="Visitors at each booking step and the drop-off between steps."
          steps={FIXTURE_FUNNEL}
        />
      </div>
      <DataTable
        caption="Countries"
        pathname="/admin/preview"
        current={sp}
        sort={params.sort ?? "visitors"}
        dir={params.dir}
        rows={rows}
        rowKey={(r) => r.country}
        highlight={(r) => r.zero}
        columns={[
          { key: "country", label: "Country", sortable: true },
          {
            key: "visitors",
            label: "Visitors",
            align: "right",
            sortable: true,
            render: (r) => r.visitors.toLocaleString("en"),
          },
          {
            key: "sessions",
            label: "Sessions",
            align: "right",
            sortable: true,
            render: (r) => r.sessions.toLocaleString("en"),
          },
          {
            key: "pageviews",
            label: "Pageviews",
            align: "right",
            sortable: true,
            render: (r) => r.pageviews.toLocaleString("en"),
          },
          {
            key: "bounce",
            label: "Bounce",
            align: "right",
            sortable: true,
            render: (r) => `${(r.bounce * 100).toFixed(1)}%`,
          },
        ]}
      />
      <TablePagination
        pathname="/admin/preview"
        current={sp}
        page={params.page}
        total={112}
        label="countries"
      />
      <ClickHeatmap
        path="/"
        cols={FIXTURE_HEAT.cols}
        rows={FIXTURE_HEAT.rows}
        cells={FIXTURE_HEAT.cells}
        totalClicks={FIXTURE_HEAT.total}
        height={640}
      />
    </div>
  );
}
