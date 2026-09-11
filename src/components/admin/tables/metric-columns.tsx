/**
 * Column sets shared by the breakdown tables (every `MetricRow`-shaped result): label + the
 * six sortable metrics, formatted consistently. Sort keys match `SORTABLE_METRICS`.
 */
import { formatDuration, formatNumber } from "@/components/admin/charts/tokens";
import type { MetricRow, SortSpec, SortableMetric } from "@/lib/analytics/queries";
import type { Column } from "./data-table";

const SORTABLE: readonly SortableMetric[] = [
  "pageviews",
  "visitors",
  "sessions",
  "bounceRate",
  "avgDurationMs",
  "conversions",
];

/** `?sort=&dir=` → a `SortSpec` the query layer accepts (default visitors desc). */
export function sortSpecFrom(sort: string | undefined, dir: "asc" | "desc"): SortSpec {
  const by = (SORTABLE as readonly string[]).includes(sort ?? "")
    ? (sort as SortableMetric)
    : "visitors";
  return { by, dir: sort ? dir : "desc" };
}

export function metricColumns<Row extends MetricRow>(
  labelHeader: string,
  renderLabel?: (row: Row) => React.ReactNode,
  options: { conversions?: boolean; duration?: boolean } = {},
): Column<Row>[] {
  const cols: Column<Row>[] = [
    { key: "label", label: labelHeader, sortable: false, render: renderLabel },
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
      key: "pageviews",
      label: "Pageviews",
      align: "right",
      sortable: true,
      render: (r) => formatNumber(r.pageviews),
    },
    {
      key: "bounceRate",
      label: "Bounce",
      align: "right",
      sortable: true,
      render: (r) => `${r.bounceRate.toFixed(1)}%`,
    },
  ];
  if (options.duration !== false) {
    cols.push({
      key: "avgDurationMs",
      label: "Avg. time",
      align: "right",
      sortable: true,
      render: (r) => formatDuration(r.avgDurationMs),
    });
  }
  if (options.conversions !== false) {
    cols.push({
      key: "conversions",
      label: "Conversions",
      align: "right",
      sortable: true,
      render: (r) => `${formatNumber(r.conversions)} (${r.conversionRate.toFixed(1)}%)`,
    });
  }
  return cols;
}
