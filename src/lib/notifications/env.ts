/**
 * Notification-specific environment. Read lazily from `process.env` (not `src/lib/env.ts`, which
 * another workstream owns) so every value stays optional: with nothing set the Noop providers
 * run and the cron route refuses every caller.
 */
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const schema = z.object({
  /** Resend API key; unset = `NoopEmailProvider`. */
  RESEND_API_KEY: optionalString,
  /** `Astrologer Kavita <bookings@example.com>` — the verified sender. */
  EMAIL_FROM: optionalString,
  /** Where practitioner copies go; falls back to `site_settings.email` when that is real. */
  EMAIL_NOTIFY_TO: optionalString,
  WHATSAPP_NOTIFICATIONS_ENABLED: z.preprocess(
    emptyToUndefined,
    z.enum(["true", "false"]).default("false"),
  ),
  /** Bearer token Vercel Cron sends to `/api/cron/reminders`. */
  CRON_SECRET: optionalString,
});

export type NotificationEnv = z.infer<typeof schema>;

/** Parsed on every call (cheap) so tests can change `process.env` between cases. */
export function getNotificationEnv(): NotificationEnv {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid notification environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Sender used when `EMAIL_FROM` is unset — only ever reaches the Noop provider. */
export const FALLBACK_EMAIL_FROM = "Astrologer Kavita <bookings@localhost>";
