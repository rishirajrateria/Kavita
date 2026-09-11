/**
 * Client-experience intake schema, shared by the form and `POST /api/testimonials`. The
 * consent checkbox is explicit and must be ticked for the row to carry `consent_given = true`;
 * an unticked box is still accepted (the message reaches Kavita) but can never be published.
 * Checkbox values arrive as `"on"`, `"true"` or `"1"` from HTML forms and `true` from JSON.
 */
import { z } from "zod";
import { HONEYPOT_FIELD, honeypotSchema } from "./contact";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const checkboxSchema = z
  .union([z.boolean(), z.string(), z.null()])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true" || v === "1");

/** `""` → undefined; `"1"`–`"5"` or 1–5 → number; anything else fails. */
export const ratingSchema = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      ctx.addIssue({ code: "custom", message: "Rating must be a whole number from 1 to 5" });
      return z.NEVER;
    }
    return n;
  });

export const SERVICE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const testimonialSchema = z.object({
  name: trimmed(2, 100, "Name"),
  email: z.string().trim().max(254).pipe(z.email("Enter a valid email address")),
  /** Free text, e.g. "Pune, India" — matched to a location by an admin later, never here. */
  location: trimmed(2, 120, "Location"),
  /** Slug of an active service, or empty when the client cannot remember. */
  serviceSlug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || SERVICE_SLUG_PATTERN.test(v), "Choose a service"),
  rating: ratingSchema,
  experience: trimmed(40, 2000, "Your experience"),
  consent: checkboxSchema,
  [HONEYPOT_FIELD]: honeypotSchema,
});

export type TestimonialInput = z.input<typeof testimonialSchema>;
export type TestimonialData = z.output<typeof testimonialSchema>;
