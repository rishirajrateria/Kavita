/**
 * Self-service manage tokens for `/booking/[token]`: HMAC-SHA256 over `bookingId.expiry` with
 * `BOOKING_TOKEN_SECRET`, base64url, 30-day expiry. The token is also stored on the booking row
 * (`manage_token`, unique) so a rescheduled booking's old link stops working even before expiry.
 * Nothing here is personal data; the booking id is a random UUID.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const MANAGE_TOKEN_TTL_DAYS = 30;
const VERSION = "v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BookingConfigError extends Error {
  override name = "BookingConfigError";
}

export function getTokenSecret(env: Record<string, string | undefined> = process.env): string {
  const secret = env.BOOKING_TOKEN_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new BookingConfigError("BOOKING_TOKEN_SECRET must be set (at least 16 characters)");
  }
  return secret;
}

export function isTokenSigningConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const secret = env.BOOKING_TOKEN_SECRET?.trim();
  return Boolean(secret && secret.length >= 16);
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

function sign(payload: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

/** Expiry for a token minted at `now`. */
export function manageTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + MANAGE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** `v1.<base64url(bookingId.expirySeconds)>.<base64url(hmac)>` — URL-safe, no padding. */
export function signManageToken(bookingId: string, expiresAt: Date, secret = getTokenSecret()) {
  if (!UUID.test(bookingId)) throw new Error("signManageToken: bookingId must be a UUID");
  const exp = Math.floor(expiresAt.getTime() / 1000);
  if (!Number.isFinite(exp) || exp <= 0) throw new Error("signManageToken: bad expiry");
  const payload = `${bookingId}.${exp}`;
  return `${VERSION}.${b64url(payload)}.${sign(payload, secret)}`;
}

export type ManageTokenVerification =
  | { ok: true; bookingId: string; expiresAt: Date }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyManageToken(
  token: string,
  options: { now?: Date; secret?: string } = {},
): ManageTokenVerification {
  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 3 || parts[0] !== VERSION || !parts[1] || !parts[2]) {
    return { ok: false, reason: "malformed" };
  }
  if (token.length > 256 || !/^[A-Za-z0-9._-]+$/.test(token)) {
    return { ok: false, reason: "malformed" };
  }
  const payload = Buffer.from(parts[1], "base64url").toString("utf8");
  const dot = payload.lastIndexOf(".");
  const bookingId = payload.slice(0, dot);
  const exp = Number(payload.slice(dot + 1));
  if (dot < 0 || !UUID.test(bookingId) || !Number.isInteger(exp)) {
    return { ok: false, reason: "malformed" };
  }
  const secret = options.secret ?? getTokenSecret();
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad_signature" };
  }
  const expiresAt = new Date(exp * 1000);
  const now = options.now ?? new Date();
  if (expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true, bookingId, expiresAt };
}
