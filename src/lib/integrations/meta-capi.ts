/**
 * Meta Conversions API sender (CLAUDE.md §13C). Sends `booking_completed`, `contact_submitted`
 * and `whatsapp_clicked` from the server with the same `event_id` the browser pixel used, so
 * Meta de-duplicates the pair. User data is SHA-256 hashed after Meta's normalisation (lower-
 * case trimmed email; digits-only phone with country code). Every send is logged to `capi_log`
 * with the payload redacted: hashes are replaced by field names, the token never appears.
 *
 * `buildMetaPayload` is pure (unit-tested with a fixed `test_event_code`); `sendMetaConversion`
 * does the network call and never throws — a failing ad platform must not break a booking.
 */
import { createHash } from "node:crypto";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import { capiLog } from "@/db/schema/integrations";
import type { ConversionEvent } from "@/lib/events";
import { findMapping, getEventMappings, resolveParams, type EventMapping } from "./mappings";
import { getIntegrationConfig, type IntegrationRecord } from "./store";

export type CapiDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export const META_GRAPH_VERSION = "v21.0";
export const CAPI_EVENTS: readonly ConversionEvent[] = [
  "booking_completed",
  "contact_submitted",
  "whatsapp_clicked",
];

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  country?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  /** `_fbp` / `_fbc` cookies when the request carries them. */
  fbp?: string | null;
  fbc?: string | null;
}

export interface CapiEventInput {
  internalEvent: ConversionEvent;
  eventId: string;
  /** Non-personal event payload (feeds `{key}` params). */
  payload: Record<string, string | number | boolean | null | undefined>;
  user: CapiUserData;
  eventSourceUrl?: string | null;
  /** Milliseconds since epoch; defaults to now. */
  timestamp?: number;
}

export interface MetaPayload {
  url: string;
  body: Record<string, unknown>;
  /** What gets logged: hashes and token replaced by markers. */
  redacted: Record<string, unknown>;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Digits only, no leading zeros or plus; Meta expects the country code included. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashUserData(user: CapiUserData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (user.email?.trim()) out.em = [sha256(normalizeEmail(user.email))];
  if (user.phone?.trim()) {
    const digits = normalizePhone(user.phone);
    if (digits.length >= 8) out.ph = [sha256(digits)];
  }
  if (user.firstName?.trim()) out.fn = [sha256(normalizeName(user.firstName))];
  if (user.country?.trim()) out.country = [sha256(user.country.trim().toLowerCase())];
  if (user.ip && user.ip !== "unknown") out.client_ip_address = user.ip;
  if (user.userAgent) out.client_user_agent = user.userAgent.slice(0, 512);
  if (user.fbp) out.fbp = user.fbp;
  if (user.fbc) out.fbc = user.fbc;
  return out;
}

export interface BuildOptions {
  pixelId: string;
  accessToken: string;
  testEventCode?: string | null;
  /** Public config of the Meta integration, for `{key}` params. */
  config?: Record<string, unknown>;
}

export function buildMetaPayload(
  input: CapiEventInput,
  mapping: EventMapping,
  options: BuildOptions,
): MetaPayload {
  const userData = hashUserData(input.user);
  const customData = resolveParams(mapping.params, { ...(options.config ?? {}), ...input.payload });
  const event: Record<string, unknown> = {
    event_name: mapping.providerEvent,
    event_time: Math.floor((input.timestamp ?? Date.now()) / 1000),
    event_id: input.eventId,
    action_source: "website",
    user_data: userData,
  };
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl;
  if (Object.keys(customData).length) event.custom_data = customData;
  const body: Record<string, unknown> = { data: [event], access_token: options.accessToken };
  if (options.testEventCode) body.test_event_code = options.testEventCode;

  const redactedUser: Record<string, string> = {};
  for (const key of Object.keys(userData)) redactedUser[key] = "[hashed]";
  if (userData.client_ip_address) redactedUser.client_ip_address = "[redacted]";
  if (userData.client_user_agent) redactedUser.client_user_agent = "[redacted]";
  const redacted: Record<string, unknown> = {
    data: [{ ...event, user_data: redactedUser }],
    access_token: "[redacted]",
  };
  if (options.testEventCode) redacted.test_event_code = options.testEventCode;

  return {
    url: `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(options.pixelId)}/events`,
    body,
    redacted,
  };
}

export type CapiSendResult =
  | { status: "sent"; httpStatus: number; response: Record<string, unknown> }
  | { status: "failed"; httpStatus: number | null; error: string }
  | { status: "skipped"; reason: "disabled" | "no_mapping" | "not_capi_event" | "no_pixel" };

export interface CapiDeps {
  db?: CapiDb | null;
  fetchImpl?: typeof fetch;
  record?: IntegrationRecord;
  pixelRecord?: IntegrationRecord;
  mappings?: EventMapping[];
  timeoutMs?: number;
}

async function logSend(
  db: CapiDb | null,
  input: CapiEventInput,
  mapping: EventMapping,
  payload: MetaPayload | null,
  result: CapiSendResult,
  testEventCode: string | null,
): Promise<void> {
  if (!db || result.status === "skipped") return;
  try {
    await db.insert(capiLog).values({
      provider: "meta_capi",
      internalEvent: input.internalEvent,
      providerEvent: mapping.providerEvent,
      eventId: input.eventId,
      status: result.status,
      httpStatus: result.httpStatus,
      request: payload?.redacted ?? {},
      response: result.status === "sent" ? result.response : null,
      errorMessage: result.status === "failed" ? result.error.slice(0, 500) : null,
      testEventCode,
    });
  } catch {
    // The log must never take the request down with it.
  }
}

/** Send one conversion. Never throws; returns what happened (and logs it when a DB exists). */
export async function sendMetaConversion(
  input: CapiEventInput,
  deps: CapiDeps = {},
): Promise<CapiSendResult> {
  if (!CAPI_EVENTS.includes(input.internalEvent)) {
    return { status: "skipped", reason: "not_capi_event" };
  }
  const db = deps.db === undefined ? getDb() : deps.db;
  const record = deps.record ?? (await getIntegrationConfig("meta_capi", db));
  if (!record.isEnabled) return { status: "skipped", reason: "disabled" };
  const accessToken = record.config.accessToken;
  if (typeof accessToken !== "string" || !accessToken) {
    return { status: "skipped", reason: "disabled" };
  }
  const pixel = deps.pixelRecord ?? (await getIntegrationConfig("meta_pixel", db));
  const pixelId = String(record.config.pixelId || pixel.config.pixelId || "").trim();
  if (!pixelId) return { status: "skipped", reason: "no_pixel" };
  const mappings = deps.mappings ?? (await getEventMappings(db));
  const mapping = findMapping(mappings, "meta_capi", input.internalEvent);
  if (!mapping) return { status: "skipped", reason: "no_mapping" };
  const testEventCode =
    typeof record.config.testEventCode === "string" && record.config.testEventCode
      ? record.config.testEventCode
      : null;
  const payload = buildMetaPayload(input, mapping, {
    pixelId,
    accessToken,
    testEventCode,
    config: { ...pixel.config, ...record.config, accessToken: undefined },
  });

  const fetchImpl = deps.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 5000);
  let result: CapiSendResult;
  try {
    const response = await fetchImpl(payload.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload.body),
      signal: controller.signal,
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    result = response.ok
      ? { status: "sent", httpStatus: response.status, response: json }
      : {
          status: "failed",
          httpStatus: response.status,
          error:
            typeof (json.error as { message?: unknown } | undefined)?.message === "string"
              ? String((json.error as { message: string }).message)
              : `HTTP ${response.status}`,
        };
  } catch (error) {
    result = {
      status: "failed",
      httpStatus: null,
      error: error instanceof Error ? error.name : "network error",
    };
  } finally {
    clearTimeout(timer);
  }
  await logSend(db, input, mapping, payload, result, testEventCode);
  return result;
}

/** Cookie values Meta uses for matching, read from a request's Cookie header. */
export function metaCookies(cookieHeader: string | null): {
  fbp: string | null;
  fbc: string | null;
} {
  const out = { fbp: null as string | null, fbc: null as string | null };
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.split("=");
    const value = rest.join("=").trim();
    if (name?.trim() === "_fbp" && /^fb\.\d\.\d+\.\d+$/.test(value)) out.fbp = value;
    if (name?.trim() === "_fbc" && /^fb\.\d\.\d+\.[\w-]+$/.test(value)) out.fbc = value;
  }
  return out;
}
