import { check, equal, excludes, includes } from "../seo-plumbing/_assert";
import { fixture } from "../notifications/_fixtures";
import type { BookingListRow } from "@/lib/admin/bookings";
import { CSV_COLUMNS, bookingsToCsv, bookingsToIcs, csvCell } from "@/lib/admin/exports";

export function run() {
  const data = fixture();
  const row: BookingListRow = {
    booking: { ...data.booking, clientNotes: "SECRET-NOTE" },
    clientName: 'Test "Quoted" Client',
    clientEmail: "test.client@example.com",
    serviceName: data.service.name,
    serviceSlug: data.service.slug,
    locationName: null,
  };
  const second: BookingListRow = {
    ...row,
    booking: { ...row.booking, id: "1a8b7c6d-2222-4ccc-8ddd-000000000009", status: "cancelled" },
    clientName: "=cmd|calc",
  };

  equal(csvCell("plain"), "plain", "csv: plain");
  equal(csvCell('a "b", c'), '"a ""b"", c"', "csv: quoting");
  equal(csvCell("=SUM(1)"), "'=SUM(1)", "csv: formula neutralised");
  equal(csvCell(null), "", "csv: null");

  const csv = bookingsToCsv([row, second], data.settings);
  const lines = csv.split("\r\n");
  equal(lines[0], CSV_COLUMNS.join(","), "csv: header");
  equal(lines.length, 4, "csv: two rows + trailing newline");
  includes(lines[1] ?? "", "9A8B7C6D,payment_pending_offline,", "csv: reference and status");
  includes(lines[1] ?? "", '"Test ""Quoted"" Client"', "csv: name quoted");
  includes(lines[1] ?? "", "2026-10-21T14:00:00.000Z", "csv: UTC start");
  includes(
    lines[1] ?? "",
    '"Wed 21 Oct 2026, 10:00 (America/New_York',
    "csv: client local time quoted",
  );
  includes(lines[2] ?? "", "'=cmd|calc", "csv: injection guard applied");
  excludes(csv, "SECRET-NOTE", "csv: client notes never exported");
  excludes(csv, "ciphertext", "csv: no ciphertext");

  const ics = bookingsToIcs([row, second], data.settings);
  includes(ics, "BEGIN:VCALENDAR\r\nVERSION:2.0", "ics: header");
  equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2, "ics: one VEVENT per booking");
  includes(ics, "DTSTART:20261021T140000Z", "ics: UTC start");
  includes(ics, "STATUS:CANCELLED", "ics: cancelled booking flagged");
  includes(
    ics.replace(/\r\n /g, ""),
    `SUMMARY:${data.service.name} — Test \\"Quoted\\" Client`.replace(/\\"/g, '"'),
    "ics: summary",
  );
  check(
    ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75),
    "ics: every line ≤ 75 octets",
  );
  excludes(ics, "SECRET-NOTE", "ics: client notes never exported");
  check(ics.endsWith("END:VCALENDAR\r\n"), "ics: terminated");
}
