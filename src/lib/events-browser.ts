/**
 * Browser subscriber for the conversion vocabulary in `src/lib/events.ts` (CLAUDE.md §13.D).
 * Every `track()` call in the browser is pushed, with its generated `eventId`, into the
 * `window.__ak` queue that `public/t.js` drains and batches to `POST /api/t`. The queue exists
 * before the tracker loads (it is `defer`red), so nothing is lost; when the visitor has opted
 * out the tracker replaces `push` with a no-op and the events go nowhere.
 *
 * Phase 6 pixels: `registerPixelDispatcher()` adds a destination that receives every bus event
 * AND anything sent through `dispatchToPixels()` directly (clicks `t.js` already counts, so
 * they must not re-enter the first-party queue). The dispatchers themselves live in
 * `src/lib/integrations/pixel-dispatch.ts`, loaded only when a tag is enabled.
 */
import { subscribe, type EventSubscriber, type TrackedEvent } from "./events";

/** Shape `t.js` accepts from the queue: name, non-personal props, de-duplication id. */
export interface QueuedEvent {
  n: string;
  pr: Record<string, string | number | boolean | null>;
  id: string;
  p?: string;
}

/** Either the plain array created here or the object `t.js` swaps in; both expose `push`. */
interface QueueWindow {
  __ak?: { push: (...items: QueuedEvent[]) => number };
}

function primitiveProps(payload: object): QueuedEvent["pr"] {
  const out: QueuedEvent["pr"] = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      out[key] = value as string | number | boolean | null;
    }
  }
  return out;
}

/** Convert a tracked event into the queue item `t.js` understands. */
export function toQueuedEvent(event: TrackedEvent): QueuedEvent {
  return { n: event.name, pr: primitiveProps(event.payload), id: event.eventId };
}

/** Push one tracked event onto `window.__ak` (creating the queue when the tracker is not loaded yet). */
export const browserSubscriber: EventSubscriber = (event) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as QueueWindow;
  const queue = w.__ak ?? (w.__ak = [] as QueuedEvent[]);
  queue.push(toQueuedEvent(event));
};

let unsubscribe: (() => void) | null = null;

/** Register the subscriber once; safe to call from several client components. */
export function registerBrowserSubscriber(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (!unsubscribe) unsubscribe = subscribe(browserSubscriber);
  return () => {
    unsubscribe?.();
    unsubscribe = null;
  };
}

/** A pixel destination: receives internal events already gated by region and consent. */
export type PixelDispatcher = (event: TrackedEvent) => void;

const pixelDispatchers = new Set<PixelDispatcher>();
let pixelForwarder: (() => void) | null = null;

/** Fan one event out to the loaded pixels only — never to the first-party queue. */
export function dispatchToPixels(event: TrackedEvent): void {
  for (const dispatcher of pixelDispatchers) {
    try {
      dispatcher(event);
    } catch {
      // A broken platform global must never break the page.
    }
  }
}

/** Register a pixel destination; the bus is forwarded to the set once. */
export function registerPixelDispatcher(dispatcher: PixelDispatcher): () => void {
  if (typeof window === "undefined") return () => undefined;
  pixelDispatchers.add(dispatcher);
  if (!pixelForwarder) pixelForwarder = subscribe(dispatchToPixels);
  return () => {
    pixelDispatchers.delete(dispatcher);
    if (pixelDispatchers.size === 0) {
      pixelForwarder?.();
      pixelForwarder = null;
    }
  };
}
