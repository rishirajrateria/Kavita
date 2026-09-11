/**
 * Geo filter on every metric: country → region → city selects in a GET form (no JS). Options
 * come from the data itself (what actually has traffic), so the lists are never empty lies.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  buildHref,
  carriedParams,
  geoLabel,
  type PanelParams,
  type SearchParams,
} from "./search-params";

export interface GeoOptions {
  countries: { code: string; name: string }[];
  regions: string[];
  cities: string[];
}

export function GeoFilterForm({
  pathname,
  current,
  params,
  options,
}: {
  pathname: string;
  current: SearchParams;
  params: PanelParams;
  options: GeoOptions;
}) {
  const label = geoLabel(params.geo);
  const selectClass =
    "h-8 max-w-44 rounded-md border border-input bg-transparent px-2 text-xs text-foreground";
  return (
    <form method="get" action={pathname} className="flex flex-wrap items-center gap-1.5">
      {carriedParams(current, ["country", "region", "city", "page"]).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="sr-only" htmlFor="geo-country">
        Country
      </label>
      <select
        id="geo-country"
        name="country"
        defaultValue={params.geo.country ?? ""}
        className={selectClass}
      >
        <option value="">All countries</option>
        {options.countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      {params.geo.country ? (
        <>
          <label className="sr-only" htmlFor="geo-region">
            Region
          </label>
          <select
            id="geo-region"
            name="region"
            defaultValue={params.geo.region ?? ""}
            className={selectClass}
          >
            <option value="">All regions</option>
            {options.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </>
      ) : null}
      {params.geo.region ? (
        <>
          <label className="sr-only" htmlFor="geo-city">
            City
          </label>
          <select
            id="geo-city"
            name="city"
            defaultValue={params.geo.city ?? ""}
            className={selectClass}
          >
            <option value="">All cities</option>
            {options.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      ) : null}
      <Button type="submit" variant="outline" size="sm">
        Filter
      </Button>
      {label ? (
        <Link
          href={buildHref(pathname, current, {
            country: undefined,
            region: undefined,
            city: undefined,
            page: undefined,
          })}
          className="text-xs text-muted-foreground"
        >
          Clear {label}
        </Link>
      ) : null}
    </form>
  );
}
