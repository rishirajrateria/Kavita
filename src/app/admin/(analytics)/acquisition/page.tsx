/**
 * `/admin/acquisition` — channels, referrers, search engines, social, UTM campaigns and the
 * dedicated AI-referral panel (ChatGPT, Perplexity, Gemini, Claude, Copilot, Bing Chat).
 */
import type { Metadata } from "next";
import { BarChart, StatTile } from "@/components/admin/charts";
import { formatNumber } from "@/components/admin/charts/tokens";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { NOT_CONNECTED_TEXT, panelContext, rangeOf } from "@/components/admin/filters/panel";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { metricColumns } from "@/components/admin/tables/metric-columns";
import { getAcquisition, type MetricRow } from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Acquisition" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/acquisition";

export default async function AcquisitionPage({ searchParams }: PageProps<"/admin/acquisition">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const acq = await getAcquisition(rangeOf(ctx));
  const aiSessions = acq.ai.reduce((n, r) => n + r.sessions, 0);
  const aiConversions = acq.ai.reduce((n, r) => n + r.conversions, 0);
  const empty = connected ? "Nothing in this range." : "Connect Supabase to see acquisition.";

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Acquisition"
        description="Where sessions come from — search, AI assistants, social, referrals, campaigns and direct."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar
        pathname={PATHNAME}
        current={sp}
        params={params}
        geoOptions={geoOptions}
        geoNote="acquisition is site-wide"
      />

      <BarChart
        title="Sessions by channel"
        description="Sessions grouped by acquisition channel."
        unit="Sessions"
        data={acq.channels.map((r) => ({
          label: r.label,
          value: r.sessions,
          hint: `${formatNumber(r.conversions)} conversions`,
        }))}
        emptyText={empty}
      />

      <section
        aria-labelledby="ai"
        className="flex flex-col gap-3 rounded-xl border border-accent-border/60 bg-surface-gold p-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ai" className="font-serif text-xl">
            AI assistant referrals
          </h2>
          <p className="text-xs text-muted-foreground">
            Visits arriving from chatgpt.com, perplexity.ai, gemini.google.com, claude.ai,
            copilot.microsoft.com and Bing Chat — the AEO signal (CLAUDE.md §9).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatTile label="AI sessions" value={formatNumber(aiSessions)} delta={null} />
          <StatTile label="AI conversions" value={formatNumber(aiConversions)} delta={null} />
          <StatTile label="Assistants seen" value={formatNumber(acq.ai.length)} delta={null} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <BarChart
            title="Sessions by assistant"
            description="Sessions referred by each AI assistant."
            unit="Sessions"
            data={acq.ai.map((r) => ({ label: r.label, value: r.sessions }))}
            emptyText={connected ? "No AI referrals yet in this range." : empty}
          />
          <DataTable<MetricRow>
            caption="AI referrals"
            pathname={PATHNAME}
            current={sp}
            rows={acq.ai}
            rowKey={(r) => r.key}
            emptyText={connected ? "No AI referrals yet in this range." : empty}
            columns={metricColumns("Assistant", undefined, { duration: false })}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Search engines" rows={acq.searchEngines} label="Engine" empty={empty} />
        <Panel title="Social" rows={acq.social} label="Network" empty={empty} />
        <Panel title="Referring sites" rows={acq.referrers} label="Site" empty={empty} />
        <Panel title="UTM campaigns" rows={acq.campaigns} label="Campaign" empty={empty} />
      </div>

      <section aria-labelledby="direct" className="flex flex-col gap-3">
        <h2 id="direct" className="font-serif text-xl">
          Direct
        </h2>
        <DataTable<MetricRow>
          caption="Direct traffic"
          pathname={PATHNAME}
          current={sp}
          rows={acq.direct.sessions > 0 ? [acq.direct] : []}
          rowKey={(r) => r.key}
          emptyText={empty}
          columns={metricColumns("Source")}
        />
      </section>
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
        columns={metricColumns(label, undefined, { duration: false })}
      />
    </section>
  );
}
