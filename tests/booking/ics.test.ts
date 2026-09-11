import { check, equal, includes } from "../seo-plumbing/_assert";
import type { Booking, Service, SiteSettings } from "@/db/schema";
import {
  SEED_NS,
  SITE_SETTINGS_KEY,
  hydrate,
  servicesSeed,
  siteSettingsSeed,
} from "@/content/seed";
import {
  buildIcs,
  calendarLinks,
  describeInZone,
  escapeIcsText,
  foldIcsLine,
} from "@/lib/booking/ics";

export function run() {
  const settings = hydrate<SiteSettings>(SEED_NS.siteSettings, SITE_SETTINGS_KEY, siteSettingsSeed);
  const service = hydrate<Service>(SEED_NS.services, "kundli-analysis", servicesSeed[1]!);
  const booking: Booking = {
    id: "6f1a2b3c-4d5e-5f60-8a7b-9c0d1e2f3a4b",
    clientId: "00000000-0000-5000-8000-000000000001",
    serviceId: service.id,
    locationId: null,
    startsAt: new Date("2026-10-05T04:30:00Z"),
    endsAt: new Date("2026-10-05T05:30:00Z"),
    clientTimezone: "America/New_York",
    mode: "online_video",
    status: "pending",
    clientNotes: "private; must not appear",
    manageToken: "v1.abc.def",
    rescheduledFromId: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    updatedAt: new Date("2026-10-01T00:00:00Z"),
  };
  const ics = buildIcs(booking, service, settings);
  const unfolded = ics.replace(/\r\n /g, "");
  includes(ics, "BEGIN:VCALENDAR\r\nVERSION:2.0", "ics: header");
  includes(ics, "DTSTART:20261005T043000Z", "ics: UTC start");
  includes(ics, "DTEND:20261005T053000Z", "ics: UTC end");
  includes(ics, "UID:6f1a2b3c-4d5e-5f60-8a7b-9c0d1e2f3a4b@", "ics: uid");
  includes(
    unfolded,
    "Your time: Mon 5 Oct 2026\\, 00:30 (America/New_York\\, GMT-4)",
    "ics: client zone (EDT)",
  );
  includes(
    unfolded,
    "Practitioner's time: Mon 5 Oct 2026\\, 10:00 (Asia/Kolkata\\, GMT+5:30)",
    "ics: practitioner zone",
  );
  includes(ics, "STATUS:CONFIRMED", "ics: confirmed");
  includes(ics, "URL:http://localhost:3000/booking/v1.abc.def", "ics: manage url");
  check(!ics.includes("must not appear"), "ics: client notes never exported");
  check(
    ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75),
    "ics: every line ≤ 75 octets",
  );
  check(ics.endsWith("END:VCALENDAR\r\n"), "ics: CRLF terminated");
  const cancelled = buildIcs({ ...booking, status: "cancelled" }, service, settings);
  includes(cancelled, "STATUS:CANCELLED", "ics: cancelled status");
  check(!cancelled.includes("VALARM"), "ics: no alarm on a cancelled event");

  equal(escapeIcsText("a;b,c\\d\ne"), "a\\;b\\,c\\\\d\\ne", "ics: text escaping");
  const folded = foldIcsLine("DESCRIPTION:" + "é".repeat(80));
  check(
    folded.split("\r\n").every((l) => Buffer.byteLength(l) <= 75),
    "ics: folding respects octets",
  );
  equal(folded.replace(/\r\n /g, ""), "DESCRIPTION:" + "é".repeat(80), "ics: folding is lossless");
  equal(
    describeInZone(new Date("2026-01-12T04:30:00Z"), "Europe/London"),
    "Mon 12 Jan 2026, 04:30 (Europe/London, GMT)",
    "ics: describeInZone winter",
  );

  const links = calendarLinks(booking, service, settings);
  includes(links.google, "dates=20261005T043000Z%2F20261005T053000Z", "links: google dates");
  includes(links.google, "ctz=America%2FNew_York", "links: google client zone");
  includes(links.outlook, "startdt=2026-10-05T04%3A30%3A00.000Z", "links: outlook start");
  equal(
    links.apple,
    "http://localhost:3000/api/bookings/v1.abc.def?format=ics",
    "links: apple = ics download",
  );
}
