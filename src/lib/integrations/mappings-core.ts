/**
 * Event mapping (CLAUDE.md §13D): the internal conversion vocabulary → each platform's event
 * name and parameters. Defaults here; `event_mappings` rows override per (provider, event).
 * Adding an ad platform = adding a mapping, never touching the app.
 *
 * This module is PURE and isomorphic — no database import — because the browser fan-out island
 * (`src/lib/integrations/pixel-dispatch.ts`) resolves mappings client-side. The database read
 * lives in `./mappings.ts`, which re-exports everything here.
 */
import type { EventMappingParams, IntegrationProvider } from "@/db/schema/integrations";
import { CONVERSION_EVENTS, type ConversionEvent } from "@/lib/events";

export type { EventMappingParams, IntegrationProvider };

export interface EventMapping {
  provider: IntegrationProvider;
  internalEvent: ConversionEvent;
  providerEvent: string;
  params: EventMappingParams;
  isEnabled: boolean;
  /** False for a built-in default, true when an admin row overrides it. */
  custom: boolean;
}

/** Providers that receive browser or server events. */
export const EVENT_PROVIDERS: readonly IntegrationProvider[] = [
  "meta_pixel",
  "meta_capi",
  "google_ads",
  "ga4",
  "linkedin_insight",
  "pinterest_tag",
  "tiktok_pixel",
  "microsoft_uet",
];

type DefaultRow = [ConversionEvent, string, EventMappingParams?];

/**
 * Sensible defaults. `{key}` in a param value is replaced by the event payload's key at fire
 * time (`{serviceSlug}`, `{step}`, `{placement}`, `{amountMinor}`, `{currency}`).
 */
const DEFAULTS: Record<IntegrationProvider, DefaultRow[]> = {
  meta_pixel: [
    ["booking_started", "InitiateCheckout", { content_name: "{serviceSlug}" }],
    ["booking_step", "AddToCart", { content_name: "{serviceSlug}", step: "{step}" }],
    ["booking_completed", "Schedule", { content_name: "{serviceSlug}" }],
    ["contact_submitted", "Contact"],
    ["whatsapp_clicked", "Contact", { content_name: "whatsapp", placement: "{placement}" }],
    ["call_clicked", "Contact", { content_name: "call", placement: "{placement}" }],
    ["testimonial_submitted", "SubmitApplication"],
  ],
  meta_capi: [
    ["booking_completed", "Schedule", { content_name: "{serviceSlug}" }],
    ["contact_submitted", "Contact"],
    ["whatsapp_clicked", "Contact", { content_name: "whatsapp", placement: "{placement}" }],
  ],
  google_ads: [
    ["booking_completed", "conversion", { label: "{bookingLabel}" }],
    ["contact_submitted", "conversion", { label: "{contactLabel}" }],
    ["whatsapp_clicked", "conversion", { label: "{contactLabel}" }],
  ],
  ga4: [
    ["booking_started", "begin_checkout", { item_id: "{serviceSlug}" }],
    ["booking_step", "checkout_progress", { checkout_step: "{step}" }],
    ["booking_completed", "generate_lead", { item_id: "{serviceSlug}" }],
    ["contact_submitted", "generate_lead", { method: "contact_form" }],
    ["whatsapp_clicked", "contact", { method: "whatsapp", placement: "{placement}" }],
    ["call_clicked", "contact", { method: "call", placement: "{placement}" }],
    ["testimonial_submitted", "submit_review"],
  ],
  linkedin_insight: [["booking_completed", "conversion", { conversion_id: "{conversionId}" }]],
  pinterest_tag: [
    ["booking_completed", "lead", { lead_type: "booking" }],
    ["contact_submitted", "lead", { lead_type: "contact" }],
  ],
  tiktok_pixel: [
    ["booking_started", "InitiateCheckout"],
    ["booking_completed", "SubmitForm", { content_name: "{serviceSlug}" }],
    ["contact_submitted", "Contact"],
    ["whatsapp_clicked", "Contact"],
  ],
  microsoft_uet: [
    ["booking_completed", "booking", { event_category: "conversion" }],
    ["contact_submitted", "contact", { event_category: "conversion" }],
    ["whatsapp_clicked", "whatsapp", { event_category: "conversion" }],
  ],
  google_search_console: [],
  bing_webmaster: [],
  google_tag: [],
  gtm: [],
  custom_head: [],
  custom_body: [],
};

export function defaultEventMappings(): EventMapping[] {
  const out: EventMapping[] = [];
  for (const provider of EVENT_PROVIDERS) {
    for (const [internalEvent, providerEvent, params] of DEFAULTS[provider]) {
      out.push({
        provider,
        internalEvent,
        providerEvent,
        params: params ?? {},
        isEnabled: true,
        custom: false,
      });
    }
  }
  return out;
}

function key(provider: string, event: string): string {
  return `${provider}:${event}`;
}

/** Defaults with DB rows layered on top; unknown providers/events in the DB are ignored. */
export function mergeEventMappings(
  overrides: readonly {
    provider: IntegrationProvider;
    internalEvent: string;
    providerEvent: string;
    params: EventMappingParams | null;
    isEnabled: boolean;
  }[],
): EventMapping[] {
  const merged = new Map(defaultEventMappings().map((m) => [key(m.provider, m.internalEvent), m]));
  for (const row of overrides) {
    if (!(CONVERSION_EVENTS as readonly string[]).includes(row.internalEvent)) continue;
    if (!EVENT_PROVIDERS.includes(row.provider)) continue;
    merged.set(key(row.provider, row.internalEvent), {
      provider: row.provider,
      internalEvent: row.internalEvent as ConversionEvent,
      providerEvent: row.providerEvent,
      params: row.params ?? {},
      isEnabled: row.isEnabled,
      custom: true,
    });
  }
  return [...merged.values()];
}

export function findMapping(
  mappings: readonly EventMapping[],
  provider: IntegrationProvider,
  event: string,
): EventMapping | null {
  return (
    mappings.find((m) => m.provider === provider && m.internalEvent === event && m.isEnabled) ??
    null
  );
}

/**
 * Replace `{key}` placeholders from the event payload and the provider's public config
 * (labels, conversion ids). Unresolved placeholders are dropped so a platform never receives
 * a literal `{bookingLabel}`.
 */
export function resolveParams(
  params: EventMappingParams,
  sources: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [name, raw] of Object.entries(params)) {
    if (raw === null) continue;
    if (typeof raw !== "string") {
      out[name] = raw;
      continue;
    }
    const match = /^\{([A-Za-z0-9_]+)\}$/.exec(raw);
    if (!match) {
      out[name] = raw;
      continue;
    }
    const value = sources[match[1] ?? ""];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[name] = value;
    }
  }
  return out;
}
