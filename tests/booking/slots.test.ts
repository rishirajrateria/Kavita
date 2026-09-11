import { check, equal } from "../seo-plumbing/_assert";
import {
  generateSlots,
  groupSlotsByLocalDate,
  localDateKey,
  nearestSlots,
  parseHHMM,
  type SlotRule,
} from "@/lib/booking/slots";
import { MARKET_ZONES, localLabel } from "./_zones";

const service: {
  id: string | null;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
} = { id: null, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 15 };
const monSat: SlotRule[] = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startTime: "10:00",
  endTime: "18:00",
  serviceId: null,
  isActive: true,
}));

function slotsFor(opts: {
  tz: string;
  from: string;
  to: string;
  now?: string;
  rules?: SlotRule[];
  step?: number;
  lead?: number;
  horizon?: number;
  exceptions?: { startsAt: string; endsAt: string; isBlocked: boolean }[];
  bookings?: { startsAt: string; endsAt: string }[];
  svc?: typeof service;
}) {
  return generateSlots({
    service: opts.svc ?? service,
    rules: opts.rules ?? monSat,
    exceptions: (opts.exceptions ?? []).map((e) => ({
      startsAt: new Date(e.startsAt),
      endsAt: new Date(e.endsAt),
      isBlocked: e.isBlocked,
    })),
    bookings: (opts.bookings ?? []).map((b) => ({
      startsAt: new Date(b.startsAt),
      endsAt: new Date(b.endsAt),
    })),
    practitionerTz: opts.tz,
    from: new Date(opts.from),
    to: new Date(opts.to),
    now: new Date(opts.now ?? "2026-01-01T00:00:00Z"),
    leadTimeHours: opts.lead ?? 0,
    horizonDays: opts.horizon ?? 365,
    stepMinutes: opts.step ?? 30,
  });
}

export function run() {
  // --- Kolkata (+5:30, no DST) against every market zone, January and July -----------------
  // Expected wall-clock of 10:00 IST in each zone, independently derived from IANA offsets.
  const expectations: Record<string, Record<(typeof MARKET_ZONES)[number], string>> = {
    // Monday 12 January 2026: LA −8, NY/Toronto −5, London +0, Dubai +4, Singapore +8, Sydney +11
    "2026-01-12": {
      "America/Los_Angeles": "2026-01-11 20:30",
      "America/New_York": "2026-01-11 23:30",
      "America/Toronto": "2026-01-11 23:30",
      "Europe/London": "2026-01-12 04:30",
      "Asia/Dubai": "2026-01-12 08:30",
      "Asia/Singapore": "2026-01-12 12:30",
      "Australia/Sydney": "2026-01-12 15:30",
    },
    // Monday 13 July 2026: LA −7, NY/Toronto −4, London +1, Dubai +4, Singapore +8, Sydney +10
    "2026-07-13": {
      "America/Los_Angeles": "2026-07-12 21:30",
      "America/New_York": "2026-07-13 00:30",
      "America/Toronto": "2026-07-13 00:30",
      "Europe/London": "2026-07-13 05:30",
      "Asia/Dubai": "2026-07-13 08:30",
      "Asia/Singapore": "2026-07-13 12:30",
      "Australia/Sydney": "2026-07-13 14:30",
    },
  };
  for (const [day, byZone] of Object.entries(expectations)) {
    const slots = slotsFor({
      tz: "Asia/Kolkata",
      from: `${day}T00:00:00Z`,
      to: `${day}T23:59:59Z`,
    });
    const first = slots[0];
    check(first !== undefined, `kolkata ${day}: slots exist`);
    if (!first) continue;
    equal(first.startsAt, `${day}T04:30:00.000Z`, `kolkata ${day}: 10:00 IST is 04:30Z`);
    equal(localLabel(first.startsAt, "Asia/Kolkata"), `${day} 10:00`, `kolkata ${day}: local`);
    for (const zone of MARKET_ZONES) {
      equal(localLabel(first.startsAt, zone), byZone[zone], `kolkata ${day} → ${zone}`);
    }
    // 10:00–18:00 with a 60-minute session and 30-minute steps: 10:00 … 17:00 = 15 starts.
    equal(slots.length, 15, `kolkata ${day}: 15 starts in an 8-hour window`);
    equal(slots.at(-1)?.startsAt, `${day}T11:30:00.000Z`, `kolkata ${day}: last start 17:00 IST`);
  }

  // Half-hour offset: the IST slot grid lands on :30 in whole-hour zones.
  const july = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-07-13T00:00:00Z",
    to: "2026-07-14T00:00:00Z",
  });
  check(
    july.every(
      (s) =>
        localLabel(s.startsAt, "Europe/London").endsWith(":30") ||
        localLabel(s.startsAt, "Europe/London").endsWith(":00"),
    ),
    "kolkata: London labels keep :00/:30 minutes",
  );
  equal(
    localLabel(july[1]!.startsAt, "Asia/Dubai"),
    "2026-07-13 09:00",
    "kolkata 10:30 IST = 09:00 Dubai",
  );

  // --- Client in America/New_York across the March and November changes ---------------------
  // A Saturday 10:00 IST slot is Friday 23:30 EST before 8 March 2026 and Saturday 00:30 EDT after.
  const nyMarch = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-03-06T00:00:00Z",
    to: "2026-03-15T00:00:00Z",
  });
  const byDayNy = groupSlotsByLocalDate(nyMarch, "America/New_York");
  const sat7 = byDayNy.find((d) => d.date === "2026-03-06"); // Fri (client-local) holds Sat-IST 10:00
  check(
    sat7?.slots.some((s) => s.startsAt === "2026-03-07T04:30:00.000Z") === true,
    "new_york march: Sat 10:00 IST (04:30Z) groups under Friday 6 March in EST",
  );
  equal(
    localLabel("2026-03-07T04:30:00.000Z", "America/New_York"),
    "2026-03-06 23:30",
    "EST label",
  );
  const sat14 = byDayNy.find((d) => d.date === "2026-03-14");
  check(
    sat14?.slots.some((s) => s.startsAt === "2026-03-14T04:30:00.000Z") === true,
    "new_york march: Sat 10:00 IST groups under Saturday 14 March in EDT",
  );
  equal(
    localLabel("2026-03-14T04:30:00.000Z", "America/New_York"),
    "2026-03-14 00:30",
    "EDT label",
  );

  // November: DST ends Sunday 1 November 2026.
  equal(
    localLabel("2026-10-31T04:30:00.000Z", "America/New_York"),
    "2026-10-31 00:30",
    "EDT before Nov 1",
  );
  equal(
    localLabel("2026-11-07T04:30:00.000Z", "America/New_York"),
    "2026-11-06 23:30",
    "EST after Nov 1",
  );
  equal(
    localDateKey("2026-11-07T04:30:00.000Z", "America/New_York"),
    "2026-11-06",
    "localDateKey EST",
  );
  equal(
    localDateKey("2026-10-31T04:30:00.000Z", "America/New_York"),
    "2026-10-31",
    "localDateKey EDT",
  );

  // --- Practitioner in Europe/London across BST (starts 29 March 2026, ends 25 October) ------
  const mon = [
    { weekday: 1, startTime: "10:00", endTime: "12:00", serviceId: null, isActive: true },
  ];
  const beforeBst = slotsFor({
    tz: "Europe/London",
    rules: mon,
    from: "2026-03-23T00:00:00Z",
    to: "2026-03-24T00:00:00Z",
  });
  equal(beforeBst[0]?.startsAt, "2026-03-23T10:00:00.000Z", "london GMT: 10:00 local = 10:00Z");
  const afterBst = slotsFor({
    tz: "Europe/London",
    rules: mon,
    from: "2026-03-30T00:00:00Z",
    to: "2026-03-31T00:00:00Z",
  });
  equal(afterBst[0]?.startsAt, "2026-03-30T09:00:00.000Z", "london BST: 10:00 local = 09:00Z");
  equal(afterBst.length, 3, "london: 10:00, 10:30, 11:00 in a 2-hour window");
  const octEnd = slotsFor({
    tz: "Europe/London",
    rules: mon,
    from: "2026-10-26T00:00:00Z",
    to: "2026-10-27T00:00:00Z",
  });
  equal(
    octEnd[0]?.startsAt,
    "2026-10-26T10:00:00.000Z",
    "london after BST ends: 10:00 local = 10:00Z",
  );
  for (const s of [...beforeBst, ...afterBst, ...octEnd]) {
    check(
      localLabel(s.startsAt, "Europe/London").endsWith("0:00") ||
        localLabel(s.startsAt, "Europe/London").includes(" 1"),
      "london wall-clock stays 10:xx–11:xx",
    );
  }
  // The Sunday of the change itself never yields a Monday slot on the wrong day.
  const weekOfChange = slotsFor({
    tz: "Europe/London",
    rules: mon,
    from: "2026-03-29T00:00:00Z",
    to: "2026-04-05T00:00:00Z",
  });
  check(
    weekOfChange.every((s) => localLabel(s.startsAt, "Europe/London").startsWith("2026-03-30")),
    "london: only Monday 30 March in that week",
  );

  // --- Lead time, horizon, step, buffers, exceptions, bookings -----------------------------
  const lead = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-13T00:00:00Z",
    now: "2026-01-11T06:00:00Z",
    lead: 24,
  });
  equal(
    lead[0]?.startsAt,
    "2026-01-12T06:00:00.000Z",
    "lead time: first slot ≥ now + 24h (11:30 IST)",
  );
  const horizon = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-20T00:00:00Z",
    now: "2026-01-10T00:00:00Z",
    horizon: 3,
  });
  check(
    horizon.every((s) => s.startsAt < "2026-01-13T00:00:00.000Z"),
    "horizon: nothing after now + 3 days",
  );
  const hourly = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-13T00:00:00Z",
    step: 60,
  });
  equal(hourly.length, 8, "step 60: 10:00 … 17:00");
  const blocked = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-13T00:00:00Z",
    exceptions: [
      { startsAt: "2026-01-12T06:00:00Z", endsAt: "2026-01-12T08:00:00Z", isBlocked: true },
    ],
  });
  check(
    !blocked.some(
      (s) => s.startsAt >= "2026-01-12T05:30:00.000Z" && s.startsAt < "2026-01-12T08:00:00.000Z",
    ),
    "blocked exception removes overlapping starts (incl. one that would run into it)",
  );
  check(
    blocked.some((s) => s.startsAt === "2026-01-12T05:00:00.000Z"),
    "a slot ending exactly when the block starts survives",
  );
  const extra = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-11T00:00:00Z",
    to: "2026-01-12T00:00:00Z", // Sunday: closed
    exceptions: [
      { startsAt: "2026-01-11T04:30:00Z", endsAt: "2026-01-11T06:30:00Z", isBlocked: false },
    ],
  });
  equal(extra.length, 3, "extra opening on a closed day yields 10:00, 10:30, 11:00 IST");
  const booked = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-13T00:00:00Z",
    bookings: [{ startsAt: "2026-01-12T06:30:00Z", endsAt: "2026-01-12T07:30:00Z" }], // 12:00–13:00 IST
  });
  const bookedStarts = booked.map((s) => localLabel(s.startsAt, "Asia/Kolkata").slice(11));
  check(
    !bookedStarts.includes("12:00") &&
      !bookedStarts.includes("11:30") &&
      !bookedStarts.includes("12:30") &&
      !bookedStarts.includes("11:00") &&
      !bookedStarts.includes("13:00"),
    "existing 12:00–13:00 booking (15 min buffer) removes 11:00–13:00 starts",
  );
  check(
    bookedStarts.includes("13:30") && bookedStarts.includes("10:30"),
    "slots either side of the buffered booking survive",
  );

  // --- Service-specific rules and helpers ----------------------------------------------------
  const perService = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-13T00:00:00Z",
    rules: [
      { weekday: 1, startTime: "10:00", endTime: "11:00", serviceId: "svc-a", isActive: true },
    ],
    svc: { ...service, id: "svc-b" },
  });
  equal(perService.length, 0, "rule scoped to another service is ignored");
  const inactive = slotsFor({
    tz: "Asia/Kolkata",
    from: "2026-01-12T00:00:00Z",
    to: "2026-01-13T00:00:00Z",
    rules: monSat.map((r) => ({ ...r, isActive: false })),
  });
  equal(inactive.length, 0, "inactive rules yield nothing");
  equal(parseHHMM("24:00")[0], 24, "parseHHMM accepts 24:00");
  let threw = false;
  try {
    parseHHMM("25:00");
  } catch {
    threw = true;
  }
  check(threw, "parseHHMM rejects 25:00");
  const near = nearestSlots(july, new Date("2026-07-13T06:30:00Z"), 3);
  equal(
    near.map((s) => s.startsAt).join(","),
    "2026-07-13T05:30:00.000Z,2026-07-13T06:00:00.000Z,2026-07-13T07:00:00.000Z",
    "nearestSlots: three neighbours, the target itself excluded",
  );
  const twice = JSON.stringify(
    slotsFor({ tz: "Asia/Kolkata", from: "2026-07-13T00:00:00Z", to: "2026-07-14T00:00:00Z" }),
  );
  equal(twice, JSON.stringify(july), "generateSlots is deterministic");
}
