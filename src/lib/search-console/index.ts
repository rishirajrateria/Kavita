/**
 * `/admin/indexing` data (Phase 6, P6-B): Google Search Console and Bing Webmaster performance
 * for a range, each cached for an hour, with honest `not_connected` / `error` states, joined
 * to first-party pageviews from the Phase 5 analytics layer.
 */
import { getPages } from "@/lib/analytics/queries";
import { fetchBingPerformance, getBingConnection } from "./bing";
import { withPerformanceCache } from "./cache";
import { fetchGooglePerformance, getGoogleConnection } from "./google";
import type { ProviderPerformance, SearchPerformanceRow } from "./types";

export type { ProviderPerformance, SearchPerformanceRow, SearchQueryRow } from "./types";

function empty(
  provider: "google" | "bing",
  state: ProviderPerformance["state"],
  message: string,
): ProviderPerformance {
  return {
    provider,
    state,
    message,
    rows: [],
    queries: [],
    totals: { clicks: 0, impressions: 0, ctr: 0, position: null },
    fetchedAt: null,
    cached: false,
  };
}

async function load(
  provider: "google" | "bing",
  range: { from: string; to: string },
  force: boolean,
): Promise<ProviderPerformance> {
  try {
    let loader: () => Promise<Pick<ProviderPerformance, "rows" | "queries" | "totals">>;
    if (provider === "google") {
      const connection = await getGoogleConnection();
      if (connection.state !== "ok") return empty(provider, "not_connected", connection.message);
      loader = () => fetchGooglePerformance(connection.credentials, range);
    } else {
      const connection = await getBingConnection();
      if (connection.state !== "ok") return empty(provider, "not_connected", connection.message);
      loader = () => fetchBingPerformance(connection.credentials, range);
    }
    const result = await withPerformanceCache(provider, `pages:${range.from}:${range.to}`, loader, {
      force,
    });
    return {
      provider,
      state: "ok",
      message: null,
      ...result.value,
      fetchedAt: result.fetchedAt.toISOString(),
      cached: result.cached,
    };
  } catch (error) {
    return empty(provider, "error", error instanceof Error ? error.message : "request failed");
  }
}

export interface IndexingRow {
  path: string;
  pageviews: number;
  visitors: number;
  google: SearchPerformanceRow | null;
  bing: SearchPerformanceRow | null;
}

export interface SearchPerformance {
  google: ProviderPerformance;
  bing: ProviderPerformance;
  /** Every path seen by any source, sorted by Google clicks, then impressions, then pageviews. */
  rows: IndexingRow[];
  analyticsConnected: boolean;
}

export async function getSearchPerformance(
  range: { from: string; to: string },
  options: { force?: boolean; limit?: number } = {},
): Promise<SearchPerformance> {
  const [google, bing, pages] = await Promise.all([
    load("google", range, options.force ?? false),
    load("bing", range, options.force ?? false),
    getPages({ ...range, kind: "top", limit: 500 }),
  ]);
  const byPath = new Map<string, IndexingRow>();
  const row = (path: string) => {
    const existing = byPath.get(path);
    if (existing) return existing;
    const created: IndexingRow = { path, pageviews: 0, visitors: 0, google: null, bing: null };
    byPath.set(path, created);
    return created;
  };
  for (const p of pages.rows) {
    const r = row(p.path);
    r.pageviews = p.pageviews;
    r.visitors = p.visitors;
  }
  for (const g of google.rows) row(g.path).google = g;
  for (const b of bing.rows) row(b.path).bing = b;
  const rows = [...byPath.values()]
    .sort(
      (a, b) =>
        (b.google?.clicks ?? 0) - (a.google?.clicks ?? 0) ||
        (b.google?.impressions ?? 0) - (a.google?.impressions ?? 0) ||
        (b.bing?.clicks ?? 0) - (a.bing?.clicks ?? 0) ||
        b.pageviews - a.pageviews,
    )
    .slice(0, options.limit ?? 200);
  return { google, bing, rows, analyticsConnected: pages.total > 0 || pages.rows.length > 0 };
}
