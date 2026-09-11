/**
 * "Test connection" per provider (CLAUDE.md §13B/C). Network calls are bounded (8 s) and every
 * outcome is a plain `{ status, message }` the admin card shows and `recordTestResult` stores.
 * Tag-only providers are validated by ID format (there is nothing to call); Search Console,
 * Bing and the Conversions API make one lightweight authenticated request each.
 */
import type { IntegrationProvider } from "@/db/schema/integrations";
import { getGoogleAccessToken, parseServiceAccount } from "./google-jwt";
import { sendMetaConversion } from "./meta-capi";
import { PROVIDERS, validateProviderConfig } from "./providers";
import type { IntegrationRecord } from "./store";

export interface TestResult {
  status: "ok" | "failed";
  message: string;
}

export interface TestDeps {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

function str(record: IntegrationRecord, key: string): string {
  const v = record.config[key];
  return typeof v === "string" ? v.trim() : "";
}

function formatOnly(provider: IntegrationProvider, record: IntegrationRecord): TestResult {
  const errors = validateProviderConfig(provider, record.config, Object.keys(record.config));
  const first = Object.values(errors)[0];
  if (first) return { status: "failed", message: first };
  return {
    status: "ok",
    message: `${PROVIDERS[provider].label}: ID format looks right. The tag loads on the site once enabled (after consent where required); confirm events in the platform's own debugger.`,
  };
}

async function testSearchConsole(record: IntegrationRecord, deps: TestDeps): Promise<TestResult> {
  const property = str(record, "property");
  const json = str(record, "serviceAccountJson");
  if (!property || !json) {
    return { status: "failed", message: "Enter the property and the service-account JSON first." };
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const { signal, done } = withTimeout(deps.timeoutMs ?? 8000);
  try {
    const key = parseServiceAccount(json);
    const token = await getGoogleAccessToken(
      key,
      ["https://www.googleapis.com/auth/webmasters.readonly"],
      fetchImpl,
    );
    const end = deps.now?.() ?? new Date();
    const start = new Date(end.getTime() - 7 * 86_400_000);
    const day = (d: Date) => d.toISOString().slice(0, 10);
    const response = await fetchImpl(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ startDate: day(start), endDate: day(end), rowLimit: 1 }),
        signal,
      },
    );
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const err = body.error as { message?: string } | undefined;
      return {
        status: "failed",
        message: `Search Console answered ${response.status}: ${err?.message ?? "check that the service-account email is a user of the property."}`,
      };
    }
    const rows = Array.isArray(body.rows) ? (body.rows as { impressions?: number }[]) : [];
    const impressions = rows.reduce((n, r) => n + (r.impressions ?? 0), 0);
    return {
      status: "ok",
      message: `Connected to ${property}: ${impressions.toLocaleString("en")} impressions in the last 7 days.`,
    };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Search Console request failed.",
    };
  } finally {
    done();
  }
}

async function testBing(record: IntegrationRecord, deps: TestDeps): Promise<TestResult> {
  const siteUrl = str(record, "siteUrl");
  const apiKey = str(record, "apiKey");
  if (!siteUrl || !apiKey) {
    return { status: "failed", message: "Enter the site URL and the API key first." };
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const { signal, done } = withTimeout(deps.timeoutMs ?? 8000);
  try {
    const response = await fetchImpl(
      `https://ssl.bing.com/webmaster/api.svc/json/GetUserSites?apikey=${encodeURIComponent(apiKey)}`,
      { signal },
    );
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return { status: "failed", message: `Bing Webmaster answered ${response.status}.` };
    }
    const sites = Array.isArray(body.d) ? (body.d as { Url?: string; IsVerified?: boolean }[]) : [];
    const norm = (u: string) => u.replace(/\/+$/, "").toLowerCase();
    const site = sites.find((s) => s.Url && norm(s.Url) === norm(siteUrl));
    if (!site) {
      return {
        status: "failed",
        message: `The key works but ${siteUrl} is not among its ${sites.length} site(s). Add the site in Bing Webmaster Tools first.`,
      };
    }
    return {
      status: "ok",
      message: `Connected: ${siteUrl} is ${site.IsVerified ? "verified" : "listed but not yet verified"} in Bing Webmaster Tools.`,
    };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Bing request failed.",
    };
  } finally {
    done();
  }
}

async function testMetaCapi(
  record: IntegrationRecord,
  pixel: IntegrationRecord,
  deps: TestDeps,
): Promise<TestResult> {
  const testEventCode = str(record, "testEventCode");
  if (!str(record, "accessToken")) {
    return { status: "failed", message: "Enter the access token first." };
  }
  if (!testEventCode) {
    return {
      status: "failed",
      message:
        "Enter a test event code (Events Manager → Test events) so the check does not count as a real conversion.",
    };
  }
  const result = await sendMetaConversion(
    {
      internalEvent: "contact_submitted",
      eventId: `test-${Date.now()}`,
      payload: {},
      user: { email: "test@example.com" },
      eventSourceUrl: null,
    },
    {
      record: { ...record, isEnabled: true },
      pixelRecord: pixel,
      fetchImpl: deps.fetchImpl,
      timeoutMs: deps.timeoutMs,
      db: null,
    },
  );
  if (result.status === "sent") {
    const received = (result.response as { events_received?: number }).events_received ?? 0;
    return {
      status: "ok",
      message: `Meta received ${received} test event(s) under ${testEventCode}. Check Events Manager → Test events, then clear the code.`,
    };
  }
  if (result.status === "failed") {
    return { status: "failed", message: `Meta answered: ${result.error}` };
  }
  return { status: "failed", message: `Nothing sent (${result.reason}).` };
}

export async function testConnection(
  provider: IntegrationProvider,
  record: IntegrationRecord,
  related: { metaPixel?: IntegrationRecord } = {},
  deps: TestDeps = {},
): Promise<TestResult> {
  switch (provider) {
    case "google_search_console":
      return testSearchConsole(record, deps);
    case "bing_webmaster":
      return testBing(record, deps);
    case "meta_capi":
      return testMetaCapi(
        record,
        related.metaPixel ?? { ...record, provider: "meta_pixel", config: {} },
        deps,
      );
    default:
      return formatOnly(provider, record);
  }
}
