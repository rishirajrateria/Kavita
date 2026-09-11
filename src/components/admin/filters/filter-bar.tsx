/**
 * One filter row above everything it scopes (dataviz rule: never per-chart filters). Date range
 * on the left, geo filter on the right, the resolved range spelled out underneath.
 */
import { DateRange } from "./date-range";
import { GeoFilterForm, type GeoOptions } from "./geo-filter";
import { geoLabel, type PanelParams, type SearchParams } from "./search-params";

export function FilterBar({
  pathname,
  current,
  params,
  geoOptions,
  geoNote,
  children,
}: {
  pathname: string;
  current: SearchParams;
  params: PanelParams;
  geoOptions?: GeoOptions;
  /** Where the geo filter only reaches part of a panel, say so honestly. */
  geoNote?: string;
  children?: React.ReactNode;
}) {
  const geo = geoLabel(params.geo);
  const { range } = params;
  return (
    <section
      aria-label="Filters"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/60 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRange pathname={pathname} current={current} params={params} />
        {geoOptions ? (
          <GeoFilterForm
            pathname={pathname}
            current={current}
            params={params}
            options={geoOptions}
          />
        ) : null}
        {children}
      </div>
      <p className="text-xs text-muted-foreground">
        {range.label}: {range.from} to {range.to} ({range.days} {range.days === 1 ? "day" : "days"})
        {geo ? ` · ${geo}` : " · all locations"} · compared with {range.previous.from} to{" "}
        {range.previous.to}
        {geo && geoNote ? ` · ${geoNote}` : ""}
      </p>
    </section>
  );
}
