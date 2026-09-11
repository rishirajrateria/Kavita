/**
 * Every chart renders to static markup with an accessible title/desc, a data-table twin, no
 * `NaN`/`undefined` in the SVG, and an honest empty state when given no data.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { check, includes, excludes } from "../seo-plumbing/_assert";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { DotMap } from "@/components/admin/charts/dot-map";
import { FunnelChart } from "@/components/admin/charts/funnel-chart";
import { HeatStrip } from "@/components/admin/charts/heat-strip";
import { LineChart } from "@/components/admin/charts/line-chart";
import { StackedBarChart } from "@/components/admin/charts/stacked-bar-chart";
import { StatTile } from "@/components/admin/charts/stat-tile";
import {
  FIXTURE_COUNTRIES,
  FIXTURE_DEVICES,
  FIXTURE_FUNNEL,
  FIXTURE_MAP,
  FIXTURE_SCROLL,
  FIXTURE_TIMESERIES,
  FIXTURE_WEEKS,
} from "@/components/admin/charts/fixture";
import {
  formatCompact,
  formatDuration,
  formatPercent,
  niceTicks,
} from "@/components/admin/charts/tokens";

function html(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

function assertChart(markup: string, name: string, dataCell: string) {
  includes(markup, 'role="img"', `${name}: svg role`);
  includes(markup, "<title", `${name}: title`);
  includes(markup, "<desc", `${name}: desc`);
  includes(markup, 'class="sr-only"', `${name}: sr-only data table`);
  includes(markup, dataCell, `${name}: data cell`);
  excludes(markup, "NaN", `${name}: NaN`);
  excludes(markup, "undefined", `${name}: undefined`);
  excludes(markup, "Infinity", `${name}: Infinity`);
}

export function run() {
  assertChart(
    html(
      createElement(BarChart, {
        title: "Countries",
        description: "d",
        data: FIXTURE_COUNTRIES,
        unit: "Visitors",
      }),
    ),
    "bar",
    "6,120",
  );
  assertChart(
    html(
      createElement(LineChart, {
        title: "Visitors",
        description: "d",
        series: FIXTURE_TIMESERIES,
        unit: "Visitors",
      }),
    ),
    "line",
    "Previous period",
  );
  assertChart(
    html(
      createElement(StackedBarChart, {
        title: "Devices",
        description: "d",
        categories: FIXTURE_WEEKS,
        series: FIXTURE_DEVICES,
        unit: "Sessions",
      }),
    ),
    "stacked",
    "1,905",
  );
  assertChart(
    html(createElement(HeatStrip, { title: "Scroll", description: "d", rows: FIXTURE_SCROLL })),
    "heat strip",
    "Reached 90%",
  );
  assertChart(
    html(createElement(FunnelChart, { title: "Funnel", description: "d", steps: FIXTURE_FUNNEL })),
    "funnel",
    "Booking completed",
  );
  assertChart(
    html(
      createElement(DotMap, {
        title: "Map",
        description: "d",
        dots: FIXTURE_MAP,
        unmatched: [{ name: "Nowhere", visitors: 3 }],
      }),
    ),
    "dot map",
    "Nowhere",
  );

  // Legend only for ≥ 2 series.
  const one = html(
    createElement(LineChart, {
      title: "Solo",
      description: "d",
      series: [FIXTURE_TIMESERIES[0]!],
      unit: "V",
    }),
  );
  excludes(one, 'aria-label="Legend"', "single series has no legend");
  const two = html(
    createElement(LineChart, {
      title: "Duo",
      description: "d",
      series: FIXTURE_TIMESERIES,
      unit: "V",
    }),
  );
  includes(two, 'aria-label="Legend"', "two series have a legend");

  // Empty states.
  const empty = html(
    createElement(BarChart, {
      title: "Empty",
      description: "d",
      data: [],
      unit: "V",
      emptyText: "Nothing yet",
    }),
  );
  includes(empty, "Nothing yet", "empty state text");
  excludes(empty, "<svg", "empty state renders no svg");

  // Stat tile deltas.
  const up = html(
    createElement(StatTile, { label: "Visitors", value: "1,204", delta: 0.12, trend: [1, 2, 3] }),
  );
  includes(up, "+12.0%", "positive delta");
  includes(up, "text-success", "up is good → success colour");
  const bounce = html(
    createElement(StatTile, { label: "Bounce", value: "40%", delta: 0.05, upIsGood: false }),
  );
  includes(bounce, "text-error", "up is bad → error colour");
  const none = html(createElement(StatTile, { label: "X", value: "1", delta: null }));
  includes(none, "No comparison", "null delta");

  // Formatters and ticks.
  check(formatCompact(1284) === "1.3K", `formatCompact 1284 → ${formatCompact(1284)}`);
  check(formatCompact(4_200_000) === "4.2M", "formatCompact millions");
  check(formatCompact(999) === "999", "formatCompact small");
  check(formatPercent(0.25) === "25.0%", "formatPercent");
  check(formatDuration(84_000) === "1m 24s", "formatDuration");
  check(niceTicks(0).length === 2, "niceTicks zero");
  const t = niceTicks(6120, 4);
  check(
    t[0] === 0 && (t[t.length - 1] ?? 0) >= 6120 && t.length <= 6,
    `niceTicks 6120 → ${t.join(",")}`,
  );
}
