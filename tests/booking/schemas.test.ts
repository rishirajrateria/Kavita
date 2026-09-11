import { check, equal } from "../seo-plumbing/_assert";
import {
  availabilityQuerySchema,
  bookingRequestSchema,
  cancelSchema,
  isValidTimeZone,
  rescheduleSchema,
} from "@/lib/booking/schemas";

const valid = {
  serviceSlug: "kundli-analysis",
  mode: "video",
  startsAt: "2026-10-05T04:30:00.000Z",
  clientTimezone: "America/New_York",
  fullName: "Asha Example",
  email: "Asha@Example.com",
  dialCode: "+1",
  phone: "(212) 555 0100",
  birthDate: "1990-04-12",
  birthTime: "23:10",
  birthPlace: "Jaipur",
  marketingConsent: "on",
  question: "Career timing",
};

export function run() {
  const ok = bookingRequestSchema.safeParse(valid);
  check(ok.success, "schemas: valid request parses");
  if (ok.success) {
    equal(ok.data.mode, "online_video", "schemas: mode alias video → online_video");
    equal(ok.data.email, "asha@example.com", "schemas: email lower-cased");
    equal(ok.data.phone, "+1 2125550100", "schemas: phone normalised");
    equal(ok.data.birthDetails?.timeAccuracy, "exact", "schemas: birth time given → exact");
    equal(ok.data.marketingConsent, true, "schemas: form 'on' → true");
    equal(ok.data.property, null, "schemas: no property block");
  }
  const offset = bookingRequestSchema.safeParse({
    ...valid,
    startsAt: "2026-10-05T10:00:00+05:30",
  });
  check(
    offset.success && offset.data.startsAt === "2026-10-05T04:30:00.000Z",
    "schemas: offset instants normalised to UTC",
  );
  const noBirth = bookingRequestSchema.safeParse({
    ...valid,
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  check(
    noBirth.success && noBirth.data.birthDetails === null,
    "schemas: empty birth fields → null",
  );
  const partial = bookingRequestSchema.safeParse({ ...valid, birthPlace: "" });
  check(
    !partial.success && partial.error.issues.some((i) => i.path[0] === "birthPlace"),
    "schemas: partial birth details rejected",
  );
  check(
    !bookingRequestSchema.safeParse({ ...valid, mode: "carrier-pigeon" }).success,
    "schemas: unknown mode",
  );
  check(
    !bookingRequestSchema.safeParse({ ...valid, clientTimezone: "Mars/Olympus" }).success,
    "schemas: bad time zone",
  );
  check(
    !bookingRequestSchema.safeParse({ ...valid, startsAt: "next tuesday" }).success,
    "schemas: bad instant",
  );
  check(
    !bookingRequestSchema.safeParse({ ...valid, website: "spam" }).success,
    "schemas: honeypot",
  );
  check(
    !bookingRequestSchema.safeParse({ ...valid, floorPlanPath: "../../etc/passwd" }).success,
    "schemas: floor plan path pattern",
  );
  const vastu = bookingRequestSchema.safeParse({
    ...valid,
    propertyType: "independent_house",
    floorPlanPath: "floor-plans/2026/10/6f1a2b3c-4d5e-5f60-8a7b-9c0d1e2f3a4b.pdf",
    compassReading: "Main door NE",
  });
  check(
    vastu.success && vastu.data.property?.type === "independent_house",
    "schemas: property block",
  );
  check(
    isValidTimeZone("Asia/Kolkata") && !isValidTimeZone("+05:30") && !isValidTimeZone(""),
    "schemas: isValidTimeZone",
  );
  check(
    availabilityQuerySchema.safeParse({
      service: "kundli-analysis",
      month: "2026-10",
      tz: "Asia/Dubai",
    }).success,
    "schemas: availability query",
  );
  check(
    !availabilityQuerySchema.safeParse({
      service: "kundli-analysis",
      month: "2026-13",
      tz: "Asia/Dubai",
    }).success,
    "schemas: month 13 rejected",
  );
  check(
    rescheduleSchema.safeParse({ startsAt: "2026-10-05T04:30:00Z" }).success,
    "schemas: reschedule",
  );
  const cancel = cancelSchema.safeParse({ reason: "  " });
  check(
    cancel.success && cancel.data.reason === undefined,
    "schemas: blank cancel reason → undefined",
  );
}
