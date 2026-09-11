/**
 * Internal conversion-event vocabulary (CLAUDE.md §13.D). The app fires each event once through
 * `track()`; subscribers (the first-party tracker, Meta Pixel/CAPI, Google Ads … — Phase 5)
 * register a mapping and fan it out. Until then the registry is empty and `track()` is a
 * no-op, on the server and in the browser alike. Payloads never carry personal data.
 */

export const CONVERSION_EVENTS = [
  "booking_started",
  "booking_step",
  "booking_completed",
  "contact_submitted",
  "whatsapp_clicked",
  "call_clicked",
  "testimonial_submitted",
] as const;

export type ConversionEvent = (typeof CONVERSION_EVENTS)[number];

/** Non-personal context only: no names, emails, phones, birth details or message text. */
export interface EventPayloads {
  booking_started: { serviceSlug?: string; locationPath?: string };
  booking_step: { step: number; serviceSlug?: string };
  booking_completed: { serviceSlug: string; currency?: string; amountMinor?: number };
  contact_submitted: { source: "web_form"; hasPhone: boolean };
  whatsapp_clicked: { placement: string };
  call_clicked: { placement: string };
  testimonial_submitted: { source: "website_form"; consentGiven: boolean; hasRating: boolean };
}

export interface TrackedEvent<E extends ConversionEvent = ConversionEvent> {
  name: E;
  payload: EventPayloads[E];
  /** Unique per firing, shared with server-side CAPI calls for de-duplication (§13.C). */
  eventId: string;
  /** Milliseconds since epoch. */
  timestamp: number;
}

export type EventSubscriber = (event: TrackedEvent) => void | Promise<void>;

const subscribers = new Set<EventSubscriber>();

/** Register a fan-out destination. Returns an unsubscribe function. */
export function subscribe(subscriber: EventSubscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

/** Number of registered subscribers — tests and diagnostics only. */
export function subscriberCount(): number {
  return subscribers.size;
}

export function isConversionEvent(name: string): name is ConversionEvent {
  return (CONVERSION_EVENTS as readonly string[]).includes(name);
}

function newEventId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fire an event once. Safe everywhere: it never throws, never awaits subscribers (a slow pixel
 * must not delay a response), and with no subscribers it does nothing.
 */
export function track<E extends ConversionEvent>(
  name: E,
  payload: EventPayloads[E],
): TrackedEvent<E> {
  const event: TrackedEvent<E> = { name, payload, eventId: newEventId(), timestamp: Date.now() };
  for (const subscriber of subscribers) {
    try {
      void Promise.resolve(subscriber(event)).catch(() => undefined);
    } catch {
      // A failing destination must never break the app path that fired the event.
    }
  }
  return event;
}
