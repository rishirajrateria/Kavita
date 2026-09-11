/** Shared shapes for the Google Search Console and Bing Webmaster readers (Phase 6, P6-B). */

export interface SearchPerformanceRow {
  /** Site-relative path (`/astrologer/india`) — the join key against first-party pageviews. */
  path: string;
  /** Absolute URL as the provider reported it. */
  url: string;
  clicks: number;
  impressions: number;
  /** 0–100. */
  ctr: number;
  /** Average position (Google) or average rank (Bing); `null` when the provider has none. */
  position: number | null;
}

export interface SearchQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
}

export type ProviderState = "ok" | "not_connected" | "error";

export interface ProviderPerformance {
  provider: "google" | "bing";
  state: ProviderState;
  /** Plain-language reason when `state !== "ok"`. */
  message: string | null;
  rows: SearchPerformanceRow[];
  queries: SearchQueryRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number | null };
  /** When the data was fetched from the provider (may be up to 1 h old — the cache TTL). */
  fetchedAt: string | null;
  cached: boolean;
}

export function toPath(url: string, siteOrigin?: string): string {
  try {
    const u = new URL(url, siteOrigin ?? "http://localhost");
    const path = u.pathname.replace(/\/+$/, "");
    return path || "/";
  } catch {
    return url;
  }
}

export function sumTotals(rows: readonly SearchPerformanceRow[]): ProviderPerformance["totals"] {
  let clicks = 0;
  let impressions = 0;
  let weightedPosition = 0;
  let positioned = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    if (r.position !== null) {
      weightedPosition += r.position * Math.max(r.impressions, 1);
      positioned += Math.max(r.impressions, 1);
    }
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
    position: positioned > 0 ? Math.round((weightedPosition / positioned) * 10) / 10 : null,
  };
}
