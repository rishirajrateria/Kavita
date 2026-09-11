"use client";

/**
 * Browser fan-out island (CLAUDE.md §13D). Rendered by `<Integrations />` only for the pixels
 * that actually loaded, so a site with no advertising tags ships none of this code.
 *
 * It does two things:
 *   1. registers one dispatcher per loaded provider on the internal event bus
 *      (`src/lib/events.ts` → `registerPixelDispatcher`), so every `track()` call in the browser
 *      reaches each platform through the admin's mapping table;
 *   2. listens for clicks on `[data-event]` CTAs (the footer and mobile-bar WhatsApp/call links
 *      that `t.js` already counts first-party) and fans those out too — for `whatsapp_clicked`
 *      it also posts the event id to `/api/track/whatsapp` so the Meta Conversions API can send
 *      the same event server-side under the same `event_id` and Meta de-duplicates the pair.
 */
import { useEffect } from "react";
import type { IntegrationProvider } from "@/db/schema/integrations";
import { isConversionEvent, type TrackedEvent } from "@/lib/events";
import { dispatchToPixels, registerPixelDispatcher } from "@/lib/events-browser";
import type { EventMapping } from "@/lib/integrations/mappings-core";
import { pixelDispatcher } from "@/lib/integrations/pixel-dispatch";

type Config = Record<string, string | number | boolean | null>;

export interface PixelFanoutProps {
  providers: IntegrationProvider[];
  configs: Record<string, Config>;
  mappings: EventMapping[];
}

function newEventId(): string {
  const c = globalThis.crypto;
  return c && typeof c.randomUUID === "function"
    ? c.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function PixelFanout({ providers, configs, mappings }: PixelFanoutProps) {
  useEffect(() => {
    const offs = providers
      .map((provider) => pixelDispatcher(provider, configs[provider] ?? {}, mappings))
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map((dispatcher) => registerPixelDispatcher(dispatcher));

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-event]");
      const name = el?.dataset.event;
      if (!el || !name || !isConversionEvent(name)) return;
      const placement = el.dataset.placement ?? el.tagName.toLowerCase();
      const eventId = newEventId();
      // `t.js` counts this click first-party already; only the pixels are fanned out here.
      dispatchToPixels({
        name,
        payload: { placement },
        eventId,
        timestamp: Date.now(),
      } as TrackedEvent);
      if (name === "whatsapp_clicked") {
        void fetch("/api/track/whatsapp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ eventId, placement, path: location.pathname }),
          keepalive: true,
        }).catch(() => undefined);
      }
    };
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      for (const off of offs) off();
    };
  }, [providers, configs, mappings]);

  return null;
}
