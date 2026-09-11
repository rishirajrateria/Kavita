/**
 * `/admin/geography` — country → region → city drill-down (sortable, paginated) and the dot
 * map. Dots are placed by matching the row to a location record with coordinates; places
 * without a match are listed under the map instead of guessed.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart, DotMap, type MapDot } from "@/components/admin/charts";
import { FilterBar } from "@/components/admin/filters/filter-bar";
import { NOT_CONNECTED_TEXT, panelContext, rangeOf } from "@/components/admin/filters/panel";
import { buildHref } from "@/components/admin/filters/search-params";
import { ConnectNotice } from "@/components/admin/shell/connect-notice";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { DataTable } from "@/components/admin/tables/data-table";
import { metricColumns, sortSpecFrom } from "@/components/admin/tables/metric-columns";
import { PAGE_SIZE, TablePagination } from "@/components/admin/tables/pagination";
import { getGeoDrilldown, type GeoRow } from "@/lib/analytics/queries";
import { getAllLocations } from "@/lib/data";

export const metadata: Metadata = { title: "Geography" };
export const dynamic = "force-dynamic";

const PATHNAME = "/admin/geography";
const UNKNOWN = "(unknown)";

export default async function GeographyPage({ searchParams }: PageProps<"/admin/geography">) {
  const ctx = await panelContext(PATHNAME, searchParams);
  const { params, sp, connected, geoOptions } = ctx;
  const sort = sortSpecFrom(params.sort, params.dir);
  const [drill, locations] = await Promise.all([
    getGeoDrilldown({
      ...rangeOf(ctx),
      country: params.geo.country,
      region: params.geo.region,
      sort,
      limit: 500,
    }),
    getAllLocations(),
  ]);
  const nameOf = new Map(geoOptions.countries.map((c) => [c.code, c.name]));
  for (const l of locations) if (l.type === "country") nameOf.set(l.countryCode, l.name);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const dots: MapDot[] = [];
  const unmatched: { name: string; visitors: number }[] = [];
  for (const row of drill.rows) {
    const display = rowLabel(row, drill.level, nameOf);
    const match = locations.find((l) => {
      if (drill.level === "country") return l.type === "country" && l.countryCode === row.country;
      if (drill.level === "region")
        return (
          l.type === "state" &&
          l.countryCode === row.country &&
          norm(l.name) === norm(row.region ?? "")
        );
      const city = norm(row.city ?? "");
      return (
        l.type === "city" &&
        l.countryCode === row.country &&
        (norm(l.name) === city || norm(l.shortName ?? "") === city)
      );
    });
    if (match && row.visitors > 0)
      dots.push({ name: display, lat: match.lat, lng: match.lng, visitors: row.visitors });
    else unmatched.push({ name: display, visitors: row.visitors });
  }
  const pageRows = drill.rows.slice((params.page - 1) * PAGE_SIZE, params.page * PAGE_SIZE);
  const levelLabel =
    drill.level === "country" ? "Country" : drill.level === "region" ? "Region" : "City";

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Geography"
        description="Where visitors come from — drill from country to region to city."
      />
      {!connected ? <ConnectNotice text={NOT_CONNECTED_TEXT} /> : null}
      <FilterBar pathname={PATHNAME} current={sp} params={params} geoOptions={geoOptions} />

      <nav aria-label="Drill-down" className="flex flex-wrap items-center gap-1 text-sm">
        <Link
          href={buildHref(PATHNAME, sp, {
            country: undefined,
            region: undefined,
            city: undefined,
            page: undefined,
          })}
        >
          All countries
        </Link>
        {drill.country ? (
          <>
            <span className="text-muted-foreground">›</span>
            <Link
              href={buildHref(PATHNAME, sp, {
                region: undefined,
                city: undefined,
                page: undefined,
              })}
            >
              {nameOf.get(drill.country) ?? drill.country}
            </Link>
          </>
        ) : null}
        {drill.region ? (
          <>
            <span className="text-muted-foreground">›</span>
            <span>{drill.region}</span>
          </>
        ) : null}
      </nav>

      <DotMap
        title={`Visitors by ${levelLabel.toLowerCase()}`}
        description="Equirectangular map; dot area is proportional to unique visitors."
        dots={dots}
        unmatched={unmatched.filter((u) => u.visitors > 0)}
        emptyText={
          connected ? "No located visitors in this range." : "Connect Supabase to see the map."
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <BarChart
          title={`Top ${levelLabel.toLowerCase()} by visitors`}
          description={`${levelLabel} rows ranked by unique visitors.`}
          unit="Visitors"
          data={[...drill.rows]
            .sort((a, b) => b.visitors - a.visitors)
            .slice(0, 10)
            .map((r) => ({ label: rowLabel(r, drill.level, nameOf), value: r.visitors }))}
        />
        <div className="flex flex-col gap-3">
          <DataTable<GeoRow>
            caption={`Visitors by ${levelLabel.toLowerCase()}`}
            pathname={PATHNAME}
            current={sp}
            sort={sort.by}
            dir={sort.dir}
            rows={pageRows}
            rowKey={(r) => r.key}
            emptyText={
              connected ? "No visitors in this range." : "Connect Supabase to see locations."
            }
            columns={metricColumns<GeoRow>(
              levelLabel,
              (r) => {
                const label = rowLabel(r, drill.level, nameOf);
                if (drill.level === "city" || label === UNKNOWN) return <span>{label}</span>;
                const href =
                  drill.level === "country"
                    ? buildHref(PATHNAME, sp, {
                        country: r.country,
                        region: undefined,
                        city: undefined,
                        page: undefined,
                      })
                    : buildHref(PATHNAME, sp, {
                        region: r.region ?? undefined,
                        city: undefined,
                        page: undefined,
                      });
                return <Link href={href}>{label} ›</Link>;
              },
              { duration: false },
            )}
          />
          <TablePagination
            pathname={PATHNAME}
            current={sp}
            page={params.page}
            total={drill.rows.length}
            label="rows"
          />
        </div>
      </div>
    </div>
  );
}

function rowLabel(
  row: GeoRow,
  level: "country" | "region" | "city",
  nameOf: Map<string, string>,
): string {
  if (level === "country") return nameOf.get(row.country) ?? row.country;
  if (level === "region") return row.region ?? UNKNOWN;
  return row.city ?? UNKNOWN;
}
