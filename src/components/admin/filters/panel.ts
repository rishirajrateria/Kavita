/**
 * Per-request context every analytics panel starts from: parsed search params, whether the
 * analytics database is reachable, and the geo-filter options (countries/regions/cities that
 * actually have traffic in the range). Server-only by way of the query layer.
 */
import { getGeoDrilldown, isAnalyticsConfigured } from "@/lib/analytics/queries";
import { getCountries } from "@/lib/data";
import type { GeoOptions } from "./geo-filter";
import { parsePanelParams, type PanelParams, type SearchParams } from "./search-params";

export interface PanelContext {
  pathname: string;
  sp: SearchParams;
  params: PanelParams;
  connected: boolean;
  geoOptions: GeoOptions;
}

export const NOT_CONNECTED_TEXT =
  "Connect Supabase (SUPABASE_DB_URL) to see data. The layout, filters and charts are ready; the rollups are empty until the tracker writes to the database.";

export async function panelContext(
  pathname: string,
  searchParams: Promise<SearchParams>,
): Promise<PanelContext> {
  const sp = await searchParams;
  const params = parsePanelParams(sp);
  const connected = isAnalyticsConfigured();
  const geoOptions: GeoOptions = { countries: [], regions: [], cities: [] };
  if (connected) {
    const { range, geo } = params;
    const [names, countries, regions, cities] = await Promise.all([
      getCountries(),
      getGeoDrilldown({ from: range.from, to: range.to, limit: 250 }),
      geo.country
        ? getGeoDrilldown({ from: range.from, to: range.to, country: geo.country, limit: 250 })
        : null,
      geo.country && geo.region
        ? getGeoDrilldown({
            from: range.from,
            to: range.to,
            country: geo.country,
            region: geo.region,
            limit: 250,
          })
        : null,
    ]);
    const nameOf = new Map(names.map((c) => [c.countryCode, c.name]));
    geoOptions.countries = countries.rows.map((r) => ({
      code: r.country,
      name: nameOf.get(r.country) ?? r.country,
    }));
    geoOptions.regions = regions?.rows.map((r) => r.region ?? "").filter(Boolean) ?? [];
    geoOptions.cities = cities?.rows.map((r) => r.city ?? "").filter(Boolean) ?? [];
  }
  return { pathname, sp, params, connected, geoOptions };
}

/** `DateRange` argument for the query layer. */
export function rangeOf(ctx: PanelContext): { from: string; to: string } {
  return { from: ctx.params.range.from, to: ctx.params.range.to };
}

/** The previous period as a `DateRange`. */
export function previousOf(ctx: PanelContext): { from: string; to: string } {
  return ctx.params.range.previous;
}

/** Week granularity for long ranges keeps the line chart legible. */
export function granularityFor(days: number): "day" | "week" | "month" {
  if (days > 200) return "month";
  if (days > 62) return "week";
  return "day";
}

/** Percent change from the query layer (12.3 = +12.3%) as the ratio `StatTile` expects. */
export function deltaRatio(percent: number | null | undefined): number | null {
  return percent === null || percent === undefined ? null : percent / 100;
}
