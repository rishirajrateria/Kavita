/**
 * Booking exports for the admin: CSV (spreadsheet) and an `.ics` feed of many events. Both are
 * admin-only and carry the client's name and contact details (that is the point of an export)
 * but never birth details, client notes or internal notes.
 */
import type { SiteSettings } from "@/db/schema";
import { describeInZone, escapeIcsText, foldIcsLine, icsStamp } from "@/lib/booking/ics";
import { getSiteUrl } from "@/lib/site";
import type { BookingListRow } from "./bookings";

export const CSV_COLUMNS = [
  "reference",
  "status",
  "service",
  "starts_at_utc",
  "ends_at_utc",
  "practitioner_local",
  "client_local",
  "client_timezone",
  "mode",
  "client_name",
  "client_email",
  "location",
  "created_at_utc",
] as const;

/** RFC 4180 quoting; leading `= + - @` are prefixed so a spreadsheet never executes a formula. */
export function csvCell(value: string | null | undefined): string {
  let s = value ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function bookingsToCsv(
  rows: readonly BookingListRow[],
  settings: Pick<SiteSettings, "timezone">,
): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const r of rows) {
    const b = r.booking;
    lines.push(
      [
        b.id.replace(/-/g, "").slice(0, 8).toUpperCase(),
        b.status,
        r.serviceName,
        b.startsAt.toISOString(),
        b.endsAt.toISOString(),
        describeInZone(b.startsAt, settings.timezone),
        describeInZone(b.startsAt, b.clientTimezone),
        b.clientTimezone,
        b.mode,
        r.clientName,
        r.clientEmail,
        r.locationName ?? "",
        b.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

const MODE_LABEL = {
  online_video: "Video call",
  online_phone: "Phone call",
  in_person: "In person",
} as const;

/** One VCALENDAR with a VEVENT per booking, for the practitioner's own calendar. */
export function bookingsToIcs(
  rows: readonly BookingListRow[],
  settings: Pick<SiteSettings, "brandName" | "timezone">,
): string {
  const host = new URL(getSiteUrl()).host;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escapeIcsText(settings.brandName)}//Admin export//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`${settings.brandName} bookings`)}`,
  ];
  for (const r of rows) {
    const b = r.booking;
    const cancelled =
      b.status === "cancelled" || b.status === "rescheduled" || b.status === "no_show";
    const description = [
      `${r.serviceName} — ${MODE_LABEL[b.mode]}`,
      `Client: ${r.clientName} (${r.clientEmail})`,
      `Client's time: ${describeInZone(b.startsAt, b.clientTimezone)}`,
      `Status: ${b.status}`,
      `Admin: ${getSiteUrl()}/admin/bookings/${b.id}`,
    ].join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id}@${host}`,
      `DTSTAMP:${icsStamp(b.updatedAt)}`,
      `DTSTART:${icsStamp(b.startsAt)}`,
      `DTEND:${icsStamp(b.endsAt)}`,
      `SUMMARY:${escapeIcsText(`${r.serviceName} — ${r.clientName}`)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `URL:${getSiteUrl()}/admin/bookings/${b.id}`,
      `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
      `SEQUENCE:${cancelled ? 1 : 0}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
