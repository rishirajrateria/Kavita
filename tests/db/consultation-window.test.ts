/**
 * Unit tests for `computeConsultationWindow` — no database, no test runner.
 *
 *   pnpm test:consultation-window
 *
 * Offsets are checked on fixed dates in January and July so DST on either side is exercised.
 * The practitioner is assumed in Asia/Kolkata (IST, no DST) with the seeded 10:00–18:00 day.
 */
import { computeConsultationWindow } from "@/lib/data/locations";
import { practitionerDay, tzOffsetMinutes } from "@/lib/data/consultation-window";
import { siteSettingsSeed } from "@/content/seed";

const failures: string[] = [];
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};
const eq = <T>(actual: T, expected: T, label: string) =>
  check(actual === expected, `${label}: expected ${String(expected)}, got ${String(actual)}`);

const JAN = new Date("2026-01-15T12:00:00Z");
const JUL = new Date("2026-07-15T12:00:00Z");
const settings = { timezone: "Asia/Kolkata", businessHours: siteSettingsSeed.businessHours };

check(settings.timezone === siteSettingsSeed.timezone, "test assumes the seeded IST practitioner");
const day = practitionerDay(settings.businessHours);
eq(day.assumed, false, "seeded business hours are used, not assumed");
eq(day.open, 10 * 60, "practitioner day opens at the earliest seeded open");
eq(day.close, 18 * 60, "practitioner day closes at the latest seeded close");

eq(tzOffsetMinutes("Asia/Kolkata", JAN), 330, "IST offset");
eq(tzOffsetMinutes("America/St_Johns", JAN), -210, "Newfoundland offset (−3:30)");

type Case = {
  name: string;
  timezone: string;
  at: Date;
  offset: number;
  label: string;
  local: string;
};
const cases: Case[] = [
  {
    name: "Mumbai",
    timezone: "Asia/Kolkata",
    at: JAN,
    offset: 0,
    label: "same time",
    local: "10:00–18:00 local",
  },
  {
    name: "Dubai",
    timezone: "Asia/Dubai",
    at: JAN,
    offset: -90,
    label: "−1h30",
    local: "8:30–16:30 local",
  },
  {
    name: "London (GMT)",
    timezone: "Europe/London",
    at: JAN,
    offset: -330,
    label: "−5h30",
    local: "7:00–12:30 local",
  },
  {
    name: "London (BST)",
    timezone: "Europe/London",
    at: JUL,
    offset: -270,
    label: "−4h30",
    local: "7:00–13:30 local",
  },
  {
    name: "New York (EST)",
    timezone: "America/New_York",
    at: JAN,
    offset: -630,
    label: "−10h30",
    local: "6:00–7:30 local",
  },
  {
    name: "New York (EDT)",
    timezone: "America/New_York",
    at: JUL,
    offset: -570,
    label: "−9h30",
    local: "7:00–8:30 local",
  },
  {
    name: "Los Angeles (PST)",
    timezone: "America/Los_Angeles",
    at: JAN,
    offset: -810,
    label: "−13h30",
    local: "20:30–22:00 local",
  },
  {
    name: "Los Angeles (PDT)",
    timezone: "America/Los_Angeles",
    at: JUL,
    offset: -750,
    label: "−12h30",
    local: "21:30–23:00 local",
  },
  {
    name: "Sydney (AEDT)",
    timezone: "Australia/Sydney",
    at: JAN,
    offset: 330,
    label: "+5h30",
    local: "15:30–22:00 local",
  },
  {
    name: "Sydney (AEST)",
    timezone: "Australia/Sydney",
    at: JUL,
    offset: 270,
    label: "+4h30",
    local: "14:30–22:00 local",
  },
  {
    name: "Singapore",
    timezone: "Asia/Singapore",
    at: JAN,
    offset: 150,
    label: "+2h30",
    local: "12:30–20:30 local",
  },
  {
    name: "Phoenix (no DST)",
    timezone: "America/Phoenix",
    at: JUL,
    offset: -750,
    label: "−12h30",
    local: "21:30–23:00 local",
  },
];

for (const c of cases) {
  const w = computeConsultationWindow({ timezone: c.timezone }, settings, c.at);
  eq(w.offsetMinutesFromPractitioner, c.offset, `${c.name} offset`);
  eq(w.offsetLabel, c.label, `${c.name} label`);
  eq(w.localWindow, c.local, `${c.name} local window`);
  eq(w.practitionerWindow, "10:00–18:00 IST", `${c.name} practitioner window`);
  check(w.note === undefined || w.note.length > 0, `${c.name}: note must not be empty`);
  check(/^\d{2}:\d{2}$/.test(w.localStart ?? ""), `${c.name}: localStart HH:MM`);
}

// A practitioner day that lands entirely overnight for the client is "by arrangement".
const narrow = computeConsultationWindow(
  { timezone: "America/Los_Angeles" },
  {
    timezone: "Asia/Kolkata",
    businessHours: { ...settings.businessHours, mon: [{ open: "11:00", close: "16:00" }] },
  },
  JAN,
);
eq(narrow.localWindow, "20:30–22:00 local", "LA with the seeded day still overlaps in the evening");
const overnight = computeConsultationWindow(
  { timezone: "America/Los_Angeles" },
  {
    timezone: "Asia/Kolkata",
    businessHours: {
      mon: [{ open: "13:00", close: "17:00" }],
      tue: null,
      wed: null,
      thu: null,
      fri: null,
      sat: null,
      sun: null,
    },
  },
  JAN,
);
eq(overnight.localWindow, "by arrangement", "LA with a 13:00–17:00 IST day has no daytime overlap");
check(
  overnight.localStart === null && /in your local time/.test(overnight.note ?? ""),
  "overnight note",
);

// Late-evening fallback is marked in the note.
const la = computeConsultationWindow({ timezone: "America/Los_Angeles" }, settings, JUL);
check(/early morning or late evening/.test(la.note ?? ""), "LA: evening fallback is explained");

// Absent/closed business hours fall back to the assumed 09:00–20:00 day and say so.
const assumed = computeConsultationWindow(
  { timezone: "Asia/Dubai" },
  { timezone: "Asia/Kolkata" },
  JAN,
);
eq(assumed.practitionerWindow, "9:00–20:00 IST", "assumed practitioner window");
eq(assumed.localWindow, "7:30–18:30 local", "assumed local window");
check(/not yet confirmed/.test(assumed.note ?? ""), "assumed hours are disclosed in the note");
const closed = computeConsultationWindow(
  { timezone: "Asia/Dubai" },
  {
    timezone: "Asia/Kolkata",
    businessHours: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
  },
  JAN,
);
eq(closed.practitionerWindow, "9:00–20:00 IST", "all-closed hours fall back to assumed");

// A non-IST practitioner gets a real abbreviation too.
const fromDubai = computeConsultationWindow(
  { timezone: "Asia/Kolkata" },
  { timezone: "Asia/Dubai" },
  JAN,
);
eq(fromDubai.offsetMinutesFromPractitioner, 90, "IST from GST");
eq(fromDubai.practitionerWindow, "9:00–20:00 GST", "GST abbreviation");

if (failures.length > 0) {
  console.error(`\n${failures.length} consultation-window failure(s):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log(`Consultation window OK (${cases.length} timezone cases).`);
