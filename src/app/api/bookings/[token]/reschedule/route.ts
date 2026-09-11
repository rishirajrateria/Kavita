/**
 * `POST /api/bookings/[token]/reschedule` — body `{ startsAt, clientTimezone? }` (JSON or form).
 * 200 `{ ok, token, booking }` for the NEW booking (new token; the old link stops working);
 * 401 invalid/expired token · 404 · 409 not_active / notice_period (+noticeHours) /
 * slot_unavailable / slot_taken (+alternatives) · 429 · 503 not_connected.
 */
import type { NextRequest } from "next/server";
import { isDatabaseConfigured } from "@/db";
import {
  bookingRateLimiter,
  honeypotHit,
  rateLimited,
  readBody,
  respond,
  statusFor,
} from "@/lib/booking/api";
import { rescheduleBooking } from "@/lib/booking/manage";
import { publicBookingView } from "../route";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/bookings/[token]/reschedule">,
) {
  const { token } = await ctx.params;
  const page = `/booking/${encodeURIComponent(token)}`;
  const limited = rateLimited(request, bookingRateLimiter);
  if (limited) return limited;
  if (!isDatabaseConfigured())
    return respond(request, page, { ok: false, reason: "not_connected" }, 503);
  const body = await readBody(request);
  if (!body) return respond(request, page, { ok: false, reason: "bad_request" }, 400);
  if (honeypotHit(body)) return respond(request, page, { ok: true }, 200, page);
  try {
    const result = await rescheduleBooking(token, body);
    if (!result.ok) return respond(request, page, result, statusFor(result.reason));
    const view = publicBookingView(result.relations);
    return respond(
      request,
      page,
      {
        ok: true,
        token: view.token,
        booking: view,
        previous: {
          startsAt: result.previous.startsAt.toISOString(),
          endsAt: result.previous.endsAt.toISOString(),
        },
      },
      200,
      `/booking/${view.token}?rescheduled=1`,
    );
  } catch (error) {
    console.error(
      `[bookings] reschedule failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return respond(request, page, { ok: false, reason: "server_error" }, 500);
  }
}
