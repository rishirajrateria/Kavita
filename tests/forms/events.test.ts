import { check, equal } from "../seo-plumbing/_assert";
import {
  CONVERSION_EVENTS,
  isConversionEvent,
  subscribe,
  subscriberCount,
  track,
  type TrackedEvent,
} from "@/lib/events";

export function run() {
  equal(CONVERSION_EVENTS.length, 7, "events: the §13.D vocabulary has seven events");
  check(isConversionEvent("contact_submitted"), "events: known name recognised");
  check(!isConversionEvent("page_view"), "events: unknown name rejected");

  // No subscribers: a no-op that still returns the event.
  equal(subscriberCount(), 0, "events: registry starts empty");
  const e = track("contact_submitted", { source: "web_form", hasPhone: true });
  equal(e.name, "contact_submitted", "events: track returns the event");
  check(e.eventId.length > 8, "events: event id generated");

  // Fan-out and a throwing subscriber that must not break the caller.
  const seen: TrackedEvent[] = [];
  const off = subscribe((ev) => {
    seen.push(ev);
  });
  const offBad = subscribe(() => {
    throw new Error("pixel down");
  });
  const fired = track("testimonial_submitted", {
    source: "website_form",
    consentGiven: true,
    hasRating: false,
  });
  equal(seen.length, 1, "events: subscriber received the event");
  equal(seen[0]?.eventId, fired.eventId, "events: same event id delivered");
  off();
  offBad();
  equal(subscriberCount(), 0, "events: unsubscribe works");
}
