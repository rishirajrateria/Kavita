/** `/admin/technology` — devices, operating systems, browsers, screen sizes and connection types. */
import type { Metadata } from "next";
import { BarChart } from "@/components/admin/charts";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { NOT_CONNECTED_TEXT, panelContext, rangeOf } from "@/components/admin/filters/panel";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { metricColumns } from "@/components/admin/tables/metric-columns";
import { getTechnology, type MetricRow } from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Technology" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/technology";

export default async function TechnologyPage({ searchParams }: PageProps<"/admin/technology">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const tech = await getTechnology(rangeOf(ctx));
  const empty = connected ? "Nothing in this range." : "Connect Supabase to see technology.";
  const bars = (rows: MetricRow[]) =>
    rows.slice(0, 8).map((r) => ({
      label: r.label,
      value: r.sessions,
      hint: `${r.bounceRate.toFixed(1)}% bounce`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Technology"
        description="What visitors use — the mobile-first, 4G reality the Core Web Vitals targets are set for."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="technology is site-wide"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <BarChart
          title="Devices"
          description="Sessions by device type."
          unit="Sessions"
          data={bars(tech.devices)}
          emptyText={empty}
        />
        <BarChart
          title="Operating systems"
          description="Sessions by operating system."
          unit="Sessions"
          data={bars(tech.os)}
          emptyText={empty}
        />
        <BarChart
          title="Browsers"
          description="Sessions by browser."
          unit="Sessions"
          data={bars(tech.browsers)}
          emptyText={empty}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Screen sizes" rows={tech.screens} label="Viewport" empty={empty} />
        <Panel title="Connection types" rows={tech.connections} label="Connection" empty={empty} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Devices in detail" rows={tech.devices} label="Device" empty={empty} />
        <Panel title="Browsers in detail" rows={tech.browsers} label="Browser" empty={empty} />
      </div>
    </div>
  );
}

function Panel({
  title,
  rows,
  label,
  empty,
}: {
  title: string;
  rows: MetricRow[];
  label: string;
  empty: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl">{title}</h2>
      <DataTable<MetricRow>
        caption={title}
        pathname={PATHNAME}
        current={{}}
        rows={rows.slice(0, 25)}
        rowKey={(r) => r.key}
        emptyText={empty}
        columns={metricColumns(label)}
      />
    </section>
  );
}
