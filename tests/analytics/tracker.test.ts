/** `public/t.js` budget and privacy markers; `src/lib/events-browser.ts` fan-out. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { check, equal } from "../seo-plumbing/_assert";
import { subscriberCount, track } from "@/lib/events";
import { browserSubscriber, registerBrowserSubscriber, toQueuedEvent } from "@/lib/events-browser";

export function run() {
  const source = readFileSync(join(process.cwd(), "public", "t.js"), "utf8");
  const gz = gzipSync(source, { level: 9 }).length;
  check(gz < 4096, `t.js gzipped is ${gz} bytes, budget is 4096`);
  check(source.includes("doNotTrack"), "t.js honours Do Not Track");
  check(source.includes("globalPrivacyControl"), "t.js honours Global Privacy Control");
  check(source.includes("ak_optout"), "t.js honours localStorage.ak_optout");
  check(source.includes("sendBeacon"), "t.js flushes with sendBeacon");
  check(!source.includes("document.cookie"), "t.js never touches cookies");
  check(!/\bvalue\b\s*:/.test(source), "t.js never serialises a form value");
  check(source.includes("__ak"), "t.js drains the window.__ak queue");
  check(
    /\b(const|let|=>)\b/.test(source) === false,
    "t.js stays ES2017-safe (no ES2015+ syntax needed)",
  );

  // Fan-out: a tracked conversion lands in window.__ak with its event id.
  const g = globalThis as { window?: unknown };
  const hadWindow = "window" in g;
  const fake: { __ak?: { n: string; id: string; pr: Record<string, unknown> }[] } = {};
  g.window = fake;
  try {
    const before = subscriberCount();
    const unsubscribe = registerBrowserSubscriber();
    registerBrowserSubscriber();
    equal(subscriberCount(), before + 1, "registerBrowserSubscriber registers exactly once");
    const event = track("whatsapp_clicked", { placement: "footer" });
    equal(fake.__ak?.length, 1, "conversion pushed to window.__ak");
    equal(fake.__ak?.[0]?.n, "whatsapp_clicked", "queued event carries the name");
    equal(fake.__ak?.[0]?.id, event.eventId, "queued event carries the generated event id");
    equal(fake.__ak?.[0]?.pr.placement, "footer", "queued event carries primitive props");
    unsubscribe();
    equal(subscriberCount(), before, "unsubscribe removes the browser subscriber");
    const queued = toQueuedEvent({
      name: "booking_step",
      payload: { step: 3, serviceSlug: undefined },
      eventId: "abc",
      timestamp: 1,
    });
    equal(Object.keys(queued.pr).join(","), "step", "undefined props are dropped");
  } finally {
    if (hadWindow) g.window = undefined;
    else delete g.window;
  }
  // Without a window the subscriber is inert.
  browserSubscriber({
    name: "call_clicked",
    payload: { placement: "x" },
    eventId: "e",
    timestamp: 0,
  });
  check(true, "browser subscriber is a no-op without window");
}
