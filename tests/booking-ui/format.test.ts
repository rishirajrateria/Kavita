import { check, equal, includes } from "../seo-plumbing/_assert";
import {
  addMonths,
  dateKeyInZone,
  dualZoneLabel,
  dualZoneParts,
  durationLabel,
  formatInZone,
  monthCells,
  monthLabel,
  offsetSentence,
  zoneAbbreviation,
} from "@/lib/booking/format";
import { calendarLinks, compactUtc } from "@/components/booking/calendar-links";
import { fallbackSummary } from "@/components/booking/api";

const NY = "America/New_York";
const IST = "Asia/Kolkata";
const LONDON = "Europe/London";

export function run() {
  // --- dual-zone label, the half-hour offset and DST on the client side --------------------
  // 18 March 2026 19:00Z: EDT (−4) → 3:00 PM; IST (+5:30) → 12:30 AM on the 19th.
  equal(
    dualZoneLabel("2026-03-18T19:00:00.000Z", NY, IST),
    "3:00 PM your time · 12:30 AM IST, Thu",
    "dualZoneLabel: NY in EDT vs IST, crossing the practitioner's midnight",
  );
  // 18 February 2026 19:00Z: EST (−5) → 2:00 PM; IST → 12:30 AM next day.
  equal(
    dualZoneLabel("2026-02-18T19:00:00.000Z", NY, IST),
    "2:00 PM your time · 12:30 AM IST, Thu",
    "dualZoneLabel: NY in EST before the March change",
  );
  // 4 November 2026 15:00Z: EST (−5, after 1 Nov change) → 10:00 AM; IST → 8:30 PM same day.
  equal(
    dualZoneLabel("2026-11-04T15:00:00.000Z", NY, IST),
    "10:00 AM your time · 8:30 PM IST",
    "dualZoneLabel: NY after the November change, same practitioner date",
  );
  // London BST vs IST: 2026-07-01 09:30Z → 10:30 AM BST · 3:00 PM IST.
  equal(
    dualZoneLabel("2026-07-01T09:30:00.000Z", LONDON, IST),
    "10:30 AM your time · 3:00 PM IST",
    "dualZoneLabel: London in BST",
  );
  equal(
    dualZoneLabel("2026-07-01T09:30:00.000Z", IST, IST),
    "3:00 PM IST",
    "dualZoneLabel: same zone collapses to one time",
  );
  const parts = dualZoneParts("2026-03-18T19:00:00.000Z", NY, IST);
  check(parts.crossesDate, "dualZoneParts: crossesDate set when her date differs");
  equal(parts.clientZone, "EDT", "dualZoneParts: EDT abbreviation");
  equal(zoneAbbreviation(IST, "2026-03-18T19:00:00.000Z"), "IST", "zoneAbbreviation: IST");
  equal(zoneAbbreviation("Asia/Dubai", "2026-03-18T19:00:00.000Z"), "GST", "zoneAbbreviation: GST");

  // --- formatting -----------------------------------------------------------------------------
  equal(
    formatInZone("2026-03-18T19:00:00.000Z", IST, "long-date"),
    "Thursday 19 March 2026",
    "formatInZone long-date",
  );
  equal(
    formatInZone("2026-03-18T19:00:00.000Z", NY, "weekday-date"),
    "Wed 18 Mar",
    "formatInZone weekday-date",
  );
  equal(
    formatInZone("2026-03-18T19:00:00.000Z", NY, "datetime"),
    "Wed 18 Mar, 3:00 PM",
    "formatInZone datetime",
  );
  equal(
    dateKeyInZone("2026-03-18T19:00:00.000Z", IST),
    "2026-03-19",
    "dateKeyInZone: next day in IST",
  );
  equal(
    dateKeyInZone("2026-03-18T19:00:00.000Z", NY),
    "2026-03-18",
    "dateKeyInZone: same day in NY",
  );
  equal(
    offsetSentence(NY, IST, "2026-03-18T19:00:00.000Z"),
    "9h30 ahead of you",
    "offsetSentence EDT→IST",
  );
  equal(
    offsetSentence("Australia/Sydney", IST, "2026-07-01T00:00:00.000Z"),
    "4h30 behind you",
    "offsetSentence AEST→IST",
  );
  equal(
    offsetSentence(IST, IST, "2026-07-01T00:00:00.000Z"),
    "the same time as you",
    "offsetSentence same",
  );
  equal(durationLabel(90), "1 h 30 min", "durationLabel 90");
  equal(durationLabel(60), "1 hour", "durationLabel 60");
  equal(durationLabel(45), "45 min", "durationLabel 45");

  // --- month grid -----------------------------------------------------------------------------
  const march = monthCells("2026-03");
  equal(march.length, 42, "monthCells: always 42 cells");
  equal(march.indexOf("2026-03-01"), 6, "monthCells: 1 March 2026 is a Sunday → 6 leading blanks");
  equal(march[36], "2026-03-31", "monthCells: last day in place");
  check(
    march.slice(37).every((c) => c === null),
    "monthCells: trailing blanks",
  );
  equal(monthCells("2026-06").indexOf("2026-06-01"), 0, "monthCells: 1 June 2026 is a Monday");
  equal(addMonths("2026-12", 1), "2027-01", "addMonths: year roll-over");
  equal(addMonths("2026-01", -1), "2025-12", "addMonths: backwards roll-over");
  equal(monthLabel("2026-03"), "March 2026", "monthLabel");

  // --- calendar links ------------------------------------------------------------------------
  equal(compactUtc("2026-03-18T19:00:00.000Z"), "20260318T190000Z", "compactUtc");
  const links = calendarLinks({
    title: "Kundli — Astrologer Kavita",
    startsAt: "2026-03-18T19:00:00.000Z",
    endsAt: "2026-03-18T20:00:00.000Z",
    token: "abc.def",
  });
  includes(
    links.google,
    "dates=20260318T190000Z%2F20260318T200000Z",
    "calendarLinks: google dates",
  );
  includes(links.outlook, "startdt=2026-03-18T19%3A00%3A00.000Z", "calendarLinks: outlook start");
  equal(links.ics, "/api/bookings/abc.def?format=ics", "calendarLinks: ics route");

  // --- 503 fallback summary never carries birth details --------------------------------------
  const summary = fallbackSummary({
    service: "Kundli",
    mode: "Video call",
    whenClient: "Wednesday 18 March 2026, 3:00 PM EDT",
    whenPractitioner: "12:30 AM IST",
    name: "Asha",
    question: "",
  });
  includes(
    summary,
    "Preferred time: Wednesday 18 March 2026, 3:00 PM EDT (12:30 AM IST)",
    "fallbackSummary time line",
  );
  check(!summary.includes("About:"), "fallbackSummary: empty question omitted");
}
