/**
 * Booking input schemas, shared by the client island and every route handler (CLAUDE.md §3:
 * Zod on both sides). Client-safe: only zod and the dial-code list — no server imports.
 * Bodies are flat so an HTML form without JavaScript can post the same fields.
 */
import { z } from "zod";
import { BIRTH_TIME_ACCURACY } from "@/lib/crypto/types";
import { DIAL_CODES, HONEYPOT_FIELD, honeypotSchema } from "@/lib/validation/contact";

export { HONEYPOT_FIELD };

export const BOOKING_MODE_VALUES = ["online_video", "online_phone", "in_person"] as const;
export type BookingModeValue = (typeof BOOKING_MODE_VALUES)[number];
/** Short aliases the URL and forms may use. */
const MODE_ALIASES: Record<string, BookingModeValue> = {
  video: "online_video",
  phone: "online_phone",
  "in-person": "in_person",
  online_video: "online_video",
  online_phone: "online_phone",
  in_person: "in_person",
};

export const PROPERTY_TYPES = [
  "apartment",
  "independent_house",
  "villa",
  "office",
  "shop",
  "factory",
  "plot",
  "other",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

const DIAL_CODE_VALUES = DIAL_CODES.map((d) => d.code) as [string, ...string[]];
const CUSTOM_DIAL_PATTERN = /^\+\d{1,4}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const STORAGE_PATH = /^floor-plans\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(pdf|png|jpg|webp)$/;

export function isValidTimeZone(value: string): boolean {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** `true`, `"true"`, `"on"`, `"1"` → true; anything else → false. Form-tolerant. */
const formBoolean = z
  .union([z.boolean(), z.string(), z.undefined(), z.null()])
  .transform((v) => v === true || v === "true" || v === "on" || v === "1");

export const timeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine(isValidTimeZone, "Choose a valid time zone");

export const instantSchema = z.iso
  .datetime({ offset: true, message: "Enter a valid date and time" })
  .transform((v) => new Date(v).toISOString());

export const modeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v, ctx) => {
    const mode = MODE_ALIASES[v];
    if (!mode) {
      ctx.addIssue({ code: "custom", message: "Choose video, phone or in person" });
      return z.NEVER;
    }
    return mode;
  });

export const availabilityQuerySchema = z.object({
  service: z.string().trim().regex(SLUG, "Unknown service"),
  month: z.string().trim().regex(MONTH, "Month must be YYYY-MM"),
  tz: timeZoneSchema,
});

export const bookingRequestSchema = z
  .object({
    serviceSlug: z.string().trim().regex(SLUG, "Choose a service"),
    mode: modeSchema,
    startsAt: instantSchema,
    clientTimezone: timeZoneSchema,
    fullName: trimmed(2, 100, "Name"),
    email: z.string().trim().max(254).pipe(z.email("Enter a valid email address")),
    dialCode: z.enum(DIAL_CODE_VALUES).default("+91"),
    customDialCode: optionalTrimmed(6),
    phone: optionalTrimmed(30),
    preferredLanguage: optionalTrimmed(40),
    // Astrology-led and integrated services
    birthDate: optionalTrimmed(10),
    birthTime: optionalTrimmed(5),
    birthPlace: optionalTrimmed(160),
    birthTimeAccuracy: z.enum(BIRTH_TIME_ACCURACY).optional(),
    // Vastu-led and integrated services
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    floorPlanPath: optionalTrimmed(200),
    compassReading: optionalTrimmed(120),
    /** Self-identified, optional, free text — never inferred. */
    gender: optionalTrimmed(40),
    question: optionalTrimmed(4000),
    locationPath: optionalTrimmed(200),
    marketingConsent: formBoolean.default(false),
    [HONEYPOT_FIELD]: honeypotSchema,
  })
  .superRefine((data, ctx) => {
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, "");
      if (!/^[\d\s\-().]+$/.test(data.phone) || digits.length < 6) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number" });
      }
      if (digits.length > 15) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone number is too long" });
      }
      if (data.dialCode === "other" && !CUSTOM_DIAL_PATTERN.test(data.customDialCode ?? "")) {
        ctx.addIssue({
          code: "custom",
          path: ["customDialCode"],
          message: "Enter a country code like +49",
        });
      }
    }
    const anyBirth = data.birthDate || data.birthTime || data.birthPlace;
    if (anyBirth) {
      if (!data.birthDate || !DATE.test(data.birthDate)) {
        ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Enter your date of birth" });
      }
      if (data.birthTime && !CLOCK.test(data.birthTime)) {
        ctx.addIssue({ code: "custom", path: ["birthTime"], message: "Enter the time as HH:MM" });
      }
      if (!data.birthPlace) {
        ctx.addIssue({
          code: "custom",
          path: ["birthPlace"],
          message: "Enter your place of birth",
        });
      }
    }
    if (data.floorPlanPath && !STORAGE_PATH.test(data.floorPlanPath)) {
      ctx.addIssue({
        code: "custom",
        path: ["floorPlanPath"],
        message: "Upload the floor plan again",
      });
    }
  })
  .transform((data) => {
    const dial = data.dialCode === "other" ? data.customDialCode : data.dialCode;
    const phone = data.phone ? `${dial} ${data.phone.replace(/\D/g, "")}` : null;
    const birthDetails =
      data.birthDate && data.birthPlace
        ? {
            date: data.birthDate,
            time: data.birthTime ?? null,
            place: data.birthPlace,
            timeAccuracy: data.birthTimeAccuracy ?? (data.birthTime ? "exact" : "unknown"),
          }
        : null;
    const property =
      data.propertyType || data.floorPlanPath || data.compassReading
        ? {
            type: data.propertyType ?? null,
            floorPlanPath: data.floorPlanPath ?? null,
            compassReading: data.compassReading ?? null,
          }
        : null;
    return {
      serviceSlug: data.serviceSlug,
      mode: data.mode,
      startsAt: data.startsAt,
      clientTimezone: data.clientTimezone,
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone,
      preferredLanguage: data.preferredLanguage ?? null,
      birthDetails,
      property,
      gender: data.gender ?? null,
      question: data.question ?? null,
      locationPath: data.locationPath ?? null,
      marketingConsent: data.marketingConsent,
    };
  });

export type BookingRequestInput = z.input<typeof bookingRequestSchema>;
export type BookingRequest = z.output<typeof bookingRequestSchema>;

export const rescheduleSchema = z.object({
  startsAt: instantSchema,
  clientTimezone: timeZoneSchema.optional(),
  [HONEYPOT_FIELD]: honeypotSchema,
});
export type RescheduleInput = z.input<typeof rescheduleSchema>;

export const cancelSchema = z.object({
  reason: optionalTrimmed(500),
  [HONEYPOT_FIELD]: honeypotSchema,
});
export type CancelInput = z.input<typeof cancelSchema>;
