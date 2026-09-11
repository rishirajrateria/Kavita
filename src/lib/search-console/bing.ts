/**
 * Bing Webmaster Tools reader (Phase 6, P6-B). Credentials from the `bing_webmaster`
 * integration row: `siteUrl` and the API key (decrypted server-side). Bing's JSON API:
 * `GetPageStats` (per-page clicks/impressions/rank) and `GetQueryStats` (per-query). Bing
 * returns its own trailing window — it does not accept a date range — so the rows are
 * filtered to the requested range where a date is present and the panel says so.
 */
import { getIntegrationConfig } from "@/lib/integrations/store";
import {
  sumTotals,
  toPath,
  type ProviderPerformance,
  type SearchPerformanceRow,
  type SearchQueryRow,
} from "./types";

export const BING_API_BASE = "https://ssl.bing.com/webmaster/api.svc/json";

export interface BingCredentials {
  siteUrl: string;
  apiKey: string;
}

export type BingConnection =
  { state: "ok"; credentials: BingCredentials } | { state: "not_connected"; message: string };

export async function getBingConnection(): Promise<BingConnection> {
  const record = await getIntegrationConfig("bing_webmaster");
  if (!record.isEnabled) {
    return {
      state: "not_connected",
      message: "Bing Webmaster Tools is not enabled in Integrations.",
    };
  }
  const siteUrl = typeof record.config.siteUrl === "string" ? record.config.siteUrl.trim() : "";
  if (!siteUrl) return { state: "not_connected", message: "No Bing site URL is set." };
  if (record.undecryptable.includes("apiKey")) {
    return {
      state: "not_connected",
      message:
        "The stored Bing API key cannot be decrypted (DATA_ENCRYPTION_KEY changed). Paste it again in Integrations.",
    };
  }
  const apiKey = typeof record.config.apiKey === "string" ? record.config.apiKey.trim() : "";
  if (!apiKey) return { state: "not_connected", message: "No Bing Webmaster API key is stored." };
  return { state: "ok", credentials: { siteUrl, apiKey } };
}

/** Bing serialises dates as `/Date(1700000000000-0000)/`. */
export function parseBingDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /\/Date\((-?\d+)/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1])).toISOString().slice(0, 10);
}

interface BingPageStat {
  Query?: string;
  Clicks?: number;
  Impressions?: number;
  AvgClickPosition?: number;
  AvgImpressionPosition?: number;
  Date?: string;
}

async function bingGet<T>(
  method: string,
  credentials: BingCredentials,
  fetchImpl: typeof fetch,
): Promise<T[]> {
  const url = new URL(`${BING_API_BASE}/${method}`);
  url.searchParams.set("siteUrl", credentials.siteUrl);
  url.searchParams.set("apikey", credentials.apiKey);
  const res = await fetchImpl(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Bing ${method} failed (${res.status})`);
  const json = (await res.json()) as { d?: T[] };
  return json.d ?? [];
}

/** Pure mapping; rows outside the range (when dated) are dropped, per-page rows are summed. */
export function mapBingPageRows(
  stats: readonly BingPageStat[],
  range: { from: string; to: string },
  siteOrigin: string,
): SearchPerformanceRow[] {
  const byPath = new Map<string, SearchPerformanceRow & { rankSum: number; ranked: number }>();
  for (const s of stats) {
    const day = parseBingDate(s.Date);
    if (day && (day < range.from || day > range.to)) continue;
    const url = s.Query ?? "";
    const path = toPath(url, siteOrigin);
    const row = byPath.get(path) ?? {
      path,
      url,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: null,
      rankSum: 0,
      ranked: 0,
    };
    row.clicks += s.Clicks ?? 0;
    row.impressions += s.Impressions ?? 0;
    if (typeof s.AvgImpressionPosition === "number") {
      row.rankSum += s.AvgImpressionPosition;
      row.ranked += 1;
    }
    byPath.set(path, row);
  }
  return [...byPath.values()].map(({ rankSum, ranked, ...row }) => ({
    ...row,
    ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 1000) / 10 : 0,
    position: ranked > 0 ? Math.round((rankSum / ranked) * 10) / 10 : null,
  }));
}

export function mapBingQueryRows(
  stats: readonly BingPageStat[],
  range: { from: string; to: string },
): SearchQueryRow[] {
  const byQuery = new Map<string, SearchQueryRow & { rankSum: number; ranked: number }>();
  for (const s of stats) {
    const day = parseBingDate(s.Date);
    if (day && (day < range.from || day > range.to)) continue;
    const query = s.Query ?? "";
    const row = byQuery.get(query) ?? {
      query,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: null,
      rankSum: 0,
      ranked: 0,
    };
    row.clicks += s.Clicks ?? 0;
    row.impressions += s.Impressions ?? 0;
    if (typeof s.AvgImpressionPosition === "number") {
      row.rankSum += s.AvgImpressionPosition;
      row.ranked += 1;
    }
    byQuery.set(query, row);
  }
  return [...byQuery.values()]
    .map(({ rankSum, ranked, ...row }) => ({
      ...row,
      ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 1000) / 10 : 0,
      position: ranked > 0 ? Math.round((rankSum / ranked) * 10) / 10 : null,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 100);
}

export async function fetchBingPerformance(
  credentials: BingCredentials,
  range: { from: string; to: string },
  fetchImpl: typeof fetch = fetch,
): Promise<Pick<ProviderPerformance, "rows" | "queries" | "totals">> {
  const [pages, queries] = await Promise.all([
    bingGet<BingPageStat>("GetPageStats", credentials, fetchImpl),
    bingGet<BingPageStat>("GetQueryStats", credentials, fetchImpl),
  ]);
  const rows = mapBingPageRows(pages, range, credentials.siteUrl);
  return { rows, queries: mapBingQueryRows(queries, range), totals: sumTotals(rows) };
}
