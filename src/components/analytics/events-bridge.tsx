"use client";

import { useEffect } from "react";
import { registerBrowserSubscriber } from "@/lib/events-browser";

/**
 * The only client code the tracker needs: subscribes `src/lib/events.ts` to the `window.__ak`
 * queue so conversion events fired by client components (the booking flow) reach `t.js`.
 * Renders nothing and ships well under 1 KB.
 */
export function EventsBridge() {
  useEffect(() => registerBrowserSubscriber(), []);
  return null;
}
