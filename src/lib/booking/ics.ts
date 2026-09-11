/**
 * RFC 5545 calendar files and "add to calendar" links for a booking. Times are emitted in UTC
 * (`…Z`), which every calendar client converts correctly; the DESCRIPTION spells the appointment
 * out in both the client's and the practitioner's zone so a forwarded invite still reads right.
 * Contains the client's name only as the attendee of their own event — no birth details, no notes.
 */
import type { Booking, Service, SiteSettings } from "@/db/schema";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

const MODE_LABEL: Record<Booking["mode"], string> = {
  online_video: "Video call",
  online_phone: "Phone call",
  in_person: "In person",
};

/** `Mon 5 Oct 2026, 10:00 (Asia/Kolkata, GMT+5:30)` — Intl only, so it matches the zone DB. */
export function describeInZone(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const offset = get("timeZoneName").replace(/^GMT\+0$/, "GMT");
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} (${tz}, ${offset})`;
}

/** `20261005T043000Z` */
export function icsStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/** Escape a TEXT value per RFC 5545 §3.3.11. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold a content line at 75 octets with CRLF + single space continuation (§3.1). */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  let first = true;
  while (start < bytes.length) {
    const max = first ? 75 : 74;
    let end = Math.min(start + max, bytes.length);
    // Never split inside a multi-byte UTF-8 sequence.
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end -= 1;
    out.push((first ? "" : " ") + bytes.subarray(start, end).toString("utf8"));
    start = end;
    first = false;
  }
  return out.join("\r\n");
}

export function manageUrlFor(booking: Pick<Booking, "manageToken">): string {
  return absoluteUrl(`/booking/${booking.manageToken}`);
}

export function icsUrlFor(booking: Pick<Booking, "manageToken">): string {
  return absoluteUrl(`/api/bookings/${booking.manageToken}?format=ics`);
}

function eventDescription(booking: Booking, service: Service, settings: SiteSettings): string {
  const lines = [
    `${service.name} with ${settings.brandName} — ${MODE_LABEL[booking.mode]}.`,
    "",
    `Your time: ${describeInZone(booking.startsAt, booking.clientTimezone)}`,
    `Practitioner's time: ${describeInZone(booking.startsAt, settings.timezone)}`,
    `Duration: ${service.durationMinutes} minutes.`,
    "",
    `Manage or reschedule: ${manageUrlFor(booking)}`,
  ];
  return lines.join("\n");
}

/** A complete VCALENDAR for one booking; `METHOD:PUBLISH`, one VEVENT, a 1-hour alarm. */
export function buildIcs(booking: Booking, service: Service, settings: SiteSettings): string {
  const host = new URL(getSiteUrl()).host;
  const cancelled = booking.status === "cancelled" || booking.status === "rescheduled";
  const location =
    booking.mode === "in_person"
      ? [settings.addressLine1, settings.addressLine2, settings.city, settings.country]
          .filter((s): s is string => Boolean(s && !s.includes("{{")))
          .join(", ")
      : MODE_LABEL[booking.mode];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escapeIcsText(settings.brandName)}//Booking//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@${host}`,
    `DTSTAMP:${icsStamp(booking.updatedAt)}`,
    `DTSTART:${icsStamp(booking.startsAt)}`,
    `DTEND:${icsStamp(booking.endsAt)}`,
    `SUMMARY:${escapeIcsText(`${service.name} — ${settings.brandName}`)}`,
    `DESCRIPTION:${escapeIcsText(eventDescription(booking, service, settings))}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${manageUrlFor(booking)}`,
    `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
    `SEQUENCE:${cancelled ? 1 : 0}`,
    "TRANSP:OPAQUE",
    ...(cancelled
      ? []
      : [
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeIcsText(`${service.name} in one hour`)}`,
          "TRIGGER:-PT1H",
          "END:VALARM",
        ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

export interface CalendarLinks {
  google: string;
  outlook: string;
  /** The `.ics` download — Apple Calendar and everything else. */
  apple: string;
}

export function calendarLinks(
  booking: Booking,
  service: Pick<Service, "name" | "durationMinutes">,
  settings: Pick<SiteSettings, "brandName" | "timezone">,
): CalendarLinks {
  const title = `${service.name} — ${settings.brandName}`;
  const details = [
    `Your time: ${describeInZone(booking.startsAt, booking.clientTimezone)}`,
    `Practitioner's time: ${describeInZone(booking.startsAt, settings.timezone)}`,
    `Manage: ${manageUrlFor(booking)}`,
  ].join("\n");
  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", title);
  google.searchParams.set("dates", `${icsStamp(booking.startsAt)}/${icsStamp(booking.endsAt)}`);
  google.searchParams.set("details", details);
  google.searchParams.set("ctz", booking.clientTimezone);
  const outlook = new URL("https://outlook.live.com/calendar/0/action/compose");
  outlook.searchParams.set("rru", "addevent");
  outlook.searchParams.set("subject", title);
  outlook.searchParams.set("startdt", booking.startsAt.toISOString());
  outlook.searchParams.set("enddt", booking.endsAt.toISOString());
  outlook.searchParams.set("body", details);
  return { google: google.toString(), outlook: outlook.toString(), apple: icsUrlFor(booking) };
}
