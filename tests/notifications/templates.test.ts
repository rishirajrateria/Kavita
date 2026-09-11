import { check, excludes, includes } from "../seo-plumbing/_assert";
import { buildEmailModel } from "@/lib/notifications/model";
import { renderEmailModel } from "@/lib/notifications/render";
import { DISCLAIMER_LINE } from "@/lib/notifications/model";
import type { NotificationKind, NotificationRecipient } from "@/lib/notifications/types";
import { describeInstant, formatDuration } from "@/lib/notifications/format";
import { fixture, fixtureBooking } from "./_fixtures";

const CASES: { kind: NotificationKind; recipient: NotificationRecipient }[] = [
  { kind: "confirmation", recipient: "client" },
  { kind: "confirmation", recipient: "practitioner" },
  { kind: "reminder_24h", recipient: "client" },
  { kind: "reminder_1h", recipient: "client" },
  { kind: "reschedule", recipient: "client" },
  { kind: "reschedule", recipient: "practitioner" },
  { kind: "cancellation", recipient: "client" },
  { kind: "cancellation", recipient: "practitioner" },
];

export async function run() {
  // Zone descriptions: DST on both ends is Intl's job; assert the spelled-out names.
  const ny = describeInstant(new Date("2026-10-21T14:00:00Z"), "America/New_York");
  check(ny.zoneName === "Eastern Daylight Time", `format: EDT name, got ${ny.zoneName}`);
  check(ny.time === "10:00 am", `format: NY time, got ${ny.time}`);
  const nyWinter = describeInstant(new Date("2026-12-21T15:00:00Z"), "America/New_York");
  check(nyWinter.zoneName === "Eastern Standard Time", `format: EST after DST ends`);
  const kolkata = describeInstant(new Date("2026-10-21T14:00:00Z"), "Asia/Kolkata");
  check(kolkata.zoneName === "India Standard Time", `format: IST name, got ${kolkata.zoneName}`);
  check(kolkata.time === "7:30 pm", `format: half-hour offset, got ${kolkata.time}`);
  check(formatDuration(90) === "1 hour 30 minutes", "format: 90 minutes");

  const data = fixture({
    previous: {
      startsAt: new Date("2026-10-19T14:00:00Z"),
      endsAt: new Date("2026-10-19T15:30:00Z"),
    },
    cancellationReason: "Travelling that week",
  });

  for (const { kind, recipient } of CASES) {
    const label = `${kind}/${recipient}`;
    const model = buildEmailModel(kind, recipient, data);
    const { subject, html, text } = await renderEmailModel(model);

    for (const [name, out] of [
      ["subject", subject],
      ["html", html],
      ["text", text],
    ] as const) {
      excludes(out, "undefined", `${label} ${name}: no "undefined"`);
      excludes(out, "[object Object]", `${label} ${name}: no object leak`);
      excludes(out, "NaN", `${label} ${name}: no NaN`);
    }
    check(subject.length > 10 && subject.length < 120, `${label}: subject length`);

    for (const out of [html, text]) {
      includes(out, "Eastern Daylight Time", `${label}: client zone name`);
      includes(out, "India Standard Time", `${label}: practitioner zone name`);
      includes(out, "America/New_York", `${label}: client IANA zone`);
      includes(out, "Asia/Kolkata", `${label}: practitioner IANA zone`);
      includes(out, "10:00 am", `${label}: client-local time`);
      includes(out, "7:30 pm", `${label}: practitioner-local time`);
      includes(out, "/booking/tok_fixture_abc123", `${label}: manage link`);
      includes(out, "Booking reference", `${label}: reference`);
      excludes(out, "ciphertext-not-plaintext", `${label}: birth ciphertext never rendered`);
      excludes(out, "{{", `${label}: no unfilled placeholder`);
    }
    includes(text, DISCLAIMER_LINE.slice(0, 40), `${label}: disclaimer line`);
    includes(html, "#161a33", `${label}: indigo text colour`);
    includes(html, "#b8923a", `${label}: gold rule`);

    if (recipient === "practitioner") {
      includes(text, "Birth details are in the admin", `${label}: birth-details note`);
      includes(text, "test.client@example.com", `${label}: client email for reply`);
      if (kind !== "cancellation") {
        includes(text, "Jersey City", `${label}: client's question included`);
      }
    } else {
      excludes(text, "Birth details are in the admin", `${label}: client copy has no admin note`);
      if (kind === "confirmation" || kind === "reminder_24h" || kind === "reschedule") {
        includes(text, "Date, time and place of birth", `${label}: what to prepare`);
      }
    }
    if (kind === "reschedule") {
      includes(text, "Previous appointment", `${label}: old slot shown`);
      includes(text, "Monday 19 October 2026", `${label}: old slot date`);
    }
    if (kind === "cancellation") includes(text, "Travelling that week", `${label}: reason`);
    if (kind === "reminder_24h") includes(subject, "tomorrow", `${label}: 24h wording`);
    if (kind === "reminder_1h") includes(subject, "Starting soon", `${label}: 1h wording`);
  }

  // Same zone on both ends: the time is shown once, not twice.
  const same = fixture({
    booking: fixtureBooking({ clientTimezone: "Asia/Kolkata" }),
  });
  const { text } = await renderEmailModel(buildEmailModel("confirmation", "client", same));
  check(
    text.split("India Standard Time").length === 2,
    "same zone: appointment shown once when zones coincide",
  );
}
