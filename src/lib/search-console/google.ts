/**
 * Google Search Console reader (Phase 6, P6-B). Credentials come from the
 * `google_search_console` integration row (P6-C's store): `property` (`sc-domain:example.com`
 * or a URL-prefix property) and the service-account JSON key, decrypted server-side.
 *
 * Flow: sign a JWT (`jwt.ts`) → exchange it for a bearer token → POST
 * `searchanalytics/query` for the range, by page (and by query for the top terms). No SDK.
 */
import { getIntegrationConfig } from "@/lib/integrations/store";
import { getSiteUrl } from "@/lib/site";
import {
  GOOGLE_TOKEN_URL,
  parseServiceAccountKey,
  signServiceAccountJwt,
  type ServiceAccountKey,
} from "./jwt";
import {
  sumTotals,
  toPath,
  type ProviderPerformance,
  type SearchPerformanceRow,
  type SearchQueryRow,
} from "./types";

export interface GoogleCredentials {
  property: string;
  key: ServiceAccountKey;
}

export type GoogleConnection =
  { state: "ok"; credentials: GoogleCredentials } | { state: "not_connected"; message: string };

/** Resolve the connection honestly: disabled, missing property or unusable key → not connected. */
export async function getGoogleConnection(): Promise<GoogleConnection> {
  const record = await getIntegrationConfig("google_search_console");
  if (!record.isEnabled) {
    return {
      state: "not_connected",
      message: "Google Search Console is not enabled in Integrations.",
    };
  }
  const property = typeof record.config.property === "string" ? record.config.property.trim() : "";
  if (!property) return { state: "not_connected", message: "No Search Console property is set." };
  if (record.undecryptable.includes("serviceAccountJson")) {
    return {
      state: "not_connected",
      message:
        "The stored service-account key cannot be decrypted (DATA_ENCRYPTION_KEY changed). Paste it again in Integrations.",
    };
  }
  const key = parseServiceAccountKey(
    typeof record.config.serviceAccountJson === "string" ? record.config.serviceAccountJson : null,
  );
  if (!key)
    return { state: "not_connected", message: "No usable service-account JSON key is stored." };
  return { state: "ok", credentials: { property, key } };
}

export async function getGoogleAccessToken(
  key: ServiceAccountKey,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const assertion = signServiceAccountJwt(key);
  const res = await fetchImpl(key.token_uri ?? GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("Google token exchange returned no access token");
  return body.access_token;
}

interface AnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function querySearchAnalytics(
  credentials: GoogleCredentials,
  token: string,
  body: { startDate: string; endDate: string; dimensions: string[]; rowLimit?: number },
  fetchImpl: typeof fetch = fetch,
): Promise<AnalyticsRow[]> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    credentials.property,
  )}/searchAnalytics/query`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ rowLimit: 500, ...body }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Search Console query failed (${res.status})`);
  const json = (await res.json()) as { rows?: AnalyticsRow[] };
  return json.rows ?? [];
}

/** Pure mapping of the API's page rows to the shared row shape. */
export function mapGooglePageRows(
  rows: readonly AnalyticsRow[],
  siteOrigin: string = getSiteUrl(),
): SearchPerformanceRow[] {
  return rows.map((r) => ({
    path: toPath(r.keys[0] ?? "", siteOrigin),
    url: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));
}

export function mapGoogleQueryRows(rows: readonly AnalyticsRow[]): SearchQueryRow[] {
  return rows.map((r) => ({
    query: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));
}

/** Uncached fetch of pages + top queries for a range. */
export async function fetchGooglePerformance(
  credentials: GoogleCredentials,
  range: { from: string; to: string },
  fetchImpl: typeof fetch = fetch,
): Promise<Pick<ProviderPerformance, "rows" | "queries" | "totals">> {
  const token = await getGoogleAccessToken(credentials.key, fetchImpl);
  const [pages, queries] = await Promise.all([
    querySearchAnalytics(
      credentials,
      token,
      { startDate: range.from, endDate: range.to, dimensions: ["page"], rowLimit: 1000 },
      fetchImpl,
    ),
    querySearchAnalytics(
      credentials,
      token,
      { startDate: range.from, endDate: range.to, dimensions: ["query"], rowLimit: 100 },
      fetchImpl,
    ),
  ]);
  const rows = mapGooglePageRows(pages);
  return { rows, queries: mapGoogleQueryRows(queries), totals: sumTotals(rows) };
}
