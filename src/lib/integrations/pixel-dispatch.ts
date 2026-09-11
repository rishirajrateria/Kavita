/**
 * Browser fan-out to the ad platforms (CLAUDE.md §13D). One dispatcher per loaded provider,
 * each translating an internal conversion event through the mapping table into the platform's
 * own call: `fbq('track', …, { eventID })`, `gtag('event', …)`, `lintrk`, `pintrk`, `ttq`, `uetq`.
 * Imported only by the integrations loader island, so the site-wide bundle never carries it.
 * Every call is guarded: a platform global that never loaded is a silent no-op.
 */
import type { IntegrationProvider } from "@/db/schema/integrations";
import type { TrackedEvent } from "@/lib/events";
import type { PixelDispatcher } from "@/lib/events-browser";
import { findMapping, resolveParams, type EventMapping } from "./mappings-core";

type Config = Record<string, string | number | boolean | null>;

interface PlatformWindow {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  lintrk?: (...args: unknown[]) => void;
  pintrk?: (...args: unknown[]) => void;
  ttq?: { track: (...args: unknown[]) => void };
  uetq?: unknown[];
}

function platform(): PlatformWindow {
  return window as unknown as PlatformWindow;
}

function params(mapping: EventMapping, event: TrackedEvent, config: Config) {
  return resolveParams(mapping.params, { ...config, ...event.payload });
}

/** Build the dispatcher for one provider; `null` for providers that receive no browser events. */
export function pixelDispatcher(
  provider: IntegrationProvider,
  config: Config,
  mappings: readonly EventMapping[],
): PixelDispatcher | null {
  const map = (event: TrackedEvent) => findMapping(mappings, provider, event.name);
  switch (provider) {
    case "meta_pixel":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || typeof w.fbq !== "function") return;
        w.fbq("track", m.providerEvent, params(m, event, config), { eventID: event.eventId });
      };
    case "google_ads":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || typeof w.gtag !== "function") return;
        const p = params(m, event, config);
        const label = typeof p.label === "string" ? p.label : "";
        const conversionId = String(config.conversionId ?? "");
        if (!conversionId || !label) return;
        w.gtag("event", m.providerEvent, {
          ...p,
          send_to: `${conversionId}/${label}`,
          transaction_id: event.eventId,
        });
      };
    case "ga4":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || typeof w.gtag !== "function") return;
        const measurementId = String(config.measurementId ?? "");
        w.gtag("event", m.providerEvent, {
          ...params(m, event, config),
          ...(measurementId ? { send_to: measurementId } : {}),
          event_id: event.eventId,
        });
      };
    case "linkedin_insight":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || typeof w.lintrk !== "function") return;
        const p = params(m, event, config);
        if (!p.conversion_id) return;
        w.lintrk("track", { conversion_id: p.conversion_id });
      };
    case "pinterest_tag":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || typeof w.pintrk !== "function") return;
        w.pintrk("track", m.providerEvent, {
          ...params(m, event, config),
          event_id: event.eventId,
        });
      };
    case "tiktok_pixel":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || typeof w.ttq?.track !== "function") return;
        w.ttq.track(m.providerEvent, params(m, event, config), { event_id: event.eventId });
      };
    case "microsoft_uet":
      return (event) => {
        const m = map(event);
        const w = platform();
        if (!m || !Array.isArray(w.uetq)) return;
        w.uetq.push("event", m.providerEvent, params(m, event, config));
      };
    default:
      return null;
  }
}
