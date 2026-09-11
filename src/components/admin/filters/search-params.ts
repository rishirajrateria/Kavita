/**
 * Search-param vocabulary shared by every analytics panel. Everything is a link or a GET form,
 * so panels stay Server Components: `?range=30d`, `?range=custom&from=&to=`,
 * `?country=&region=&city=`, `?sort=visitors&dir=desc`, `?page=2`, `?path=/about`, `?kind=entry`.
 * Date maths lives in the analytics layer (`resolveRange`); this file only parses and builds URLs.
 */
import {
  RANGE_LABELS,
  RANGE_PRESETS,
  resolveRange,
  type RangePreset,
  type ResolvedRange,
} from "@/lib/analytics/ranges";

export { RANGE_LABELS, RANGE_PRESETS, type RangePreset, type ResolvedRange };

export type SearchParams = Record<string, string | string[] | undefined>;

export interface GeoFilter {
  country?: string;
  region?: string;
  city?: string;
}

export interface PanelParams {
  range: ResolvedRange;
  geo: GeoFilter;
  page: number;
  sort: string | undefined;
  dir: "asc" | "desc";
  path: string | undefined;
  kind: string | undefined;
}

function one(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

export function parsePanelParams(sp: SearchParams, now = new Date()): PanelParams {
  const range = resolveRange(
    { preset: one(sp, "range"), from: one(sp, "from"), to: one(sp, "to") },
    now,
  );
  const page = Math.max(1, Math.min(10_000, Number.parseInt(one(sp, "page") ?? "1", 10) || 1));
  const path = one(sp, "path");
  const country = one(sp, "country")?.toUpperCase().slice(0, 2);
  const region = country ? one(sp, "region")?.slice(0, 80) : undefined;
  const city = region ? one(sp, "city")?.slice(0, 80) : undefined;
  return {
    range,
    geo: { country, region, city },
    page,
    sort: one(sp, "sort")?.slice(0, 40),
    dir: one(sp, "dir") === "asc" ? "asc" : "desc",
    path: path && path.startsWith("/") && !path.startsWith("//") ? path.slice(0, 200) : undefined,
    kind: one(sp, "kind")?.slice(0, 20),
  };
}

/** Query string that keeps the current filters and applies `overrides` (`undefined` removes). */
export function buildHref(
  pathname: string,
  current: SearchParams,
  overrides: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Hidden inputs so a GET form keeps every filter it does not itself edit. */
export function carriedParams(current: SearchParams, except: string[]): [string, string][] {
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(current)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && !except.includes(key)) out.push([key, v]);
  }
  return out;
}

export function geoLabel(geo: GeoFilter): string | null {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Whole-number `pageSize` window for queries that take `limit`/`offset`. */
export function pageWindow(page: number, pageSize: number): { limit: number; offset: number } {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}
