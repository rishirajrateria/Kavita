/**
 * Shared plumbing for the booking route handlers: rate limiting, JSON-or-form bodies, and the
 * JSON/redirect response split (a JavaScript-free form post is sent back to a page with
 * `?error=` instead of receiving JSON). Never echoes personal data.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRateLimiter, clientIpFromHeaders, type RateLimiter } from "@/lib/rate-limit";
import { readBody, wantsRedirect } from "@/lib/validation/form-request";
import { HONEYPOT_FIELD } from "./schemas";

export { readBody, wantsRedirect };

/** Booking writes: 10 per 10 minutes per client (a reschedule + a retry or two, not a flood). */
export const bookingRateLimiter: RateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 10 * 60_000,
});
/** Availability reads are cheap but not free: 120 per minute per client. */
export const availabilityRateLimiter: RateLimiter = createRateLimiter({
  limit: 120,
  windowMs: 60_000,
});

export const NO_STORE = { "cache-control": "no-store" } as const;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function rateLimited(request: NextRequest, limiter: RateLimiter): NextResponse | null {
  const result = limiter.check(clientIpFromHeaders(request.headers));
  if (result.ok) return null;
  const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return json({ ok: false, reason: "rate_limited", retryAfterSeconds }, 429, {
    "retry-after": String(retryAfterSeconds),
  });
}

/** True when the honeypot field was filled — answer success and write nothing. */
export function honeypotHit(body: Record<string, unknown>): boolean {
  const value = body[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Send a JavaScript-free form post back to `path` with the outcome in the query string; JSON
 * clients get the result object with the given status.
 */
export function respond(
  request: NextRequest,
  path: string,
  result: { ok: boolean; reason?: string } & Record<string, unknown>,
  status: number,
  successPath?: string,
) {
  if (wantsRedirect(request)) {
    const url = new URL(result.ok && successPath ? successPath : path, request.url);
    if (result.ok) url.searchParams.set("done", "1");
    else url.searchParams.set("error", String(result.reason ?? "server_error"));
    return NextResponse.redirect(url, 303);
  }
  return json(result, status);
}

/** Map an engine failure reason onto an HTTP status. */
export function statusFor(reason: string): number {
  switch (reason) {
    case "validation":
    case "bad_request":
      return 400;
    case "invalid_token":
    case "expired":
      return 401;
    case "not_found":
    case "unknown_service":
      return 404;
    case "slot_taken":
    case "slot_unavailable":
    case "not_active":
    case "notice_period":
    case "mode_unavailable":
      return 409;
    case "not_connected":
    case "encryption_unavailable":
      return 503;
    default:
      return 500;
  }
}
