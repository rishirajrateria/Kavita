/**
 * `/admin/conversions` — the booking funnel with drop-off, the other conversion goals, and
 * conversion rate by page, country, device and source.
 */
import type { Metadata } from "next";
import { FunnelChart, StatTile } from "@/components/admin/charts";
import { formatNumber } from "@/components/admin/charts/tokens";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { NOT_CONNECTED_TEXT, panelContext, rangeOf } from "@/components/admin/filters/panel";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable, type Column } from "@/components/admin/tables/data-table";
import { getFunnel, type ConversionRow } from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Conversions" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/conversions";

export default async function ConversionsPage({ searchParams }: PageProps<"/admin/conversions">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const funnel = await getFunnel(rangeOf(ctx));
  const empty = connected
    ? "No conversions in this range."
    : "Connect Supabase to see conversions.";
  const completed = funnel.steps.find((s) => s.key === "completed")?.sessions ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Conversions"
        description="Bookings, enquiries and calls — and where in the booking flow people stop."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="conversions are site-wide; see the by-country table below"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Bookings completed" value={formatNumber(completed)} delta={null} />
        <StatTile
          label="Funnel conversion"
          value={`${funnel.conversionRate.toFixed(1)}%`}
          delta={null}
          compareLabel="of booking starts"
        />
        <StatTile
          label="Contact forms"
          value={formatNumber(funnel.contactSubmitted)}
          delta={null}
        />
        <StatTile
          label="WhatsApp clicks"
          value={formatNumber(funnel.whatsappClicked)}
          delta={null}
        />
        <StatTile label="Call clicks" value={formatNumber(funnel.callClicked)} delta={null} />
        <StatTile
          label="Testimonials"
          value={formatNumber(funnel.testimonialSubmitted)}
          delta={null}
        />
      </div>

      <FunnelChart
        title="Booking funnel"
        description="Sessions reaching each booking step; drop-off is measured against the previous step."
        steps={funnel.steps.map((s) => ({ label: s.label, count: s.sessions }))}
        emptyText={
          connected ? "No booking starts in this range." : "Connect Supabase to see the funnel."
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="By page" label="Page" rows={funnel.byPage} empty={empty} mono />
        <Panel title="By country" label="Country" rows={funnel.byCountry} empty={empty} />
        <Panel title="By device" label="Device" rows={funnel.byDevice} empty={empty} />
        <Panel title="By source" label="Source" rows={funnel.bySource} empty={empty} />
      </div>
    </div>
  );
}

function Panel({
  title,
  label,
  rows,
  empty,
  mono,
}: {
  title: string;
  label: string;
  rows: ConversionRow[];
  empty: string;
  mono?: boolean;
}) {
  const columns: Column<ConversionRow>[] = [
    {
      key: "label",
      label,
      render: (r) => <span className={mono ? "font-mono text-xs" : undefined}>{r.label}</span>,
    },
    { key: "sessions", label: "Sessions", align: "right", render: (r) => formatNumber(r.sessions) },
    {
      key: "bookings",
      label: "Bookings",
      align: "right",
      render: (r) => `${formatNumber(r.bookings)} (${r.bookingRate.toFixed(1)}%)`,
    },
    {
      key: "conversions",
      label: "All conversions",
      align: "right",
      render: (r) => `${formatNumber(r.conversions)} (${r.conversionRate.toFixed(1)}%)`,
    },
  ];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl">{title}</h2>
      <DataTable<ConversionRow>
        caption={title}
        pathname={PATHNAME}
        current={{}}
        rows={rows.slice(0, 25)}
        rowKey={(r) => r.key}
        emptyText={empty}
        columns={columns}
      />
    </section>
  );
}
