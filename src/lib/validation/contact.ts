/**
 * Contact-form schema, shared by the client form and `POST /api/contact` (CLAUDE.md §3: Zod
 * on both sides for all input). `website` is the honeypot: real people never see it, so any
 * value means a bot. Phone is optional; when given it is normalised to `+<dial> <number>`.
 */
import { z } from "zod";

/** The seven target markets (CLAUDE.md §2) plus a free-text "other". */
export const DIAL_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "other", label: "Other country code" },
] as const;

export type DialCode = (typeof DIAL_CODES)[number]["code"];
const DIAL_CODE_VALUES = DIAL_CODES.map((d) => d.code) as [DialCode, ...DialCode[]];

export const HONEYPOT_FIELD = "website";

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

/** `+` followed by 1–4 digits, e.g. `+91`, `+971`. */
const CUSTOM_DIAL_PATTERN = /^\+\d{1,4}$/;
/** Digits, spaces, hyphens and brackets only; 6–15 digits in total (ITU E.164 max is 15). */
const PHONE_DIGITS_MIN = 6;
const PHONE_DIGITS_MAX = 15;

export const honeypotSchema = z
  .string()
  .max(0, "Spam check failed")
  .optional()
  .transform(() => undefined);

export const contactSchema = z
  .object({
    name: trimmed(2, 100, "Name"),
    email: z.string().trim().max(254).pipe(z.email("Enter a valid email address")),
    dialCode: z.enum(DIAL_CODE_VALUES).default("+91"),
    /** Only read when `dialCode === "other"`. */
    customDialCode: optionalTrimmed(6),
    phone: optionalTrimmed(30),
    message: trimmed(20, 4000, "Message"),
    [HONEYPOT_FIELD]: honeypotSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.phone) return;
    const digits = data.phone.replace(/\D/g, "");
    if (!/^[\d\s\-().]+$/.test(data.phone) || digits.length < PHONE_DIGITS_MIN) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number" });
    }
    if (digits.length > PHONE_DIGITS_MAX) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone number is too long" });
    }
    if (data.dialCode === "other") {
      if (!data.customDialCode || !CUSTOM_DIAL_PATTERN.test(data.customDialCode)) {
        ctx.addIssue({
          code: "custom",
          path: ["customDialCode"],
          message: "Enter a country code like +49",
        });
      }
    }
  })
  .transform((data) => {
    const dial = data.dialCode === "other" ? data.customDialCode : data.dialCode;
    const phone = data.phone ? `${dial} ${data.phone.replace(/\D/g, "")}` : null;
    return { name: data.name, email: data.email, phone, message: data.message };
  });

export type ContactInput = z.input<typeof contactSchema>;
export type ContactMessageData = z.output<typeof contactSchema>;
