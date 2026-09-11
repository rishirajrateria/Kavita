/**
 * `POST /api/bookings/[token]/cancel` — body `{ reason? }` (JSON or form). 200 `{ ok, booking }`
 * with status `cancelled`; 401 invalid/expired · 404 · 409 not_active · 429 · 503.
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
import { cancelBooking } from "@/lib/booking/manage";
import { publicBookingView } from "../route";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/bookings/[token]/cancel">,
) {
  const { token } = await ctx.params;
  const page = `/booking/${encodeURIComponent(token)}`;
  const limited = rateLimited(request, bookingRateLimiter);
  if (limited) return limited;
  if (!isDatabaseConfigured())
    return respond(request, page, { ok: false, reason: "not_connected" }, 503);
  const body = (await readBody(request)) ?? {};
  if (honeypotHit(body)) return respond(request, page, { ok: true }, 200, page);
  try {
    const result = await cancelBooking(token, body);
    if (!result.ok) return respond(request, page, result, statusFor(result.reason));
    return respond(
      request,
      page,
      { ok: true, booking: publicBookingView(result.relations) },
      200,
      `${page}?cancelled=1`,
    );
  } catch (error) {
    console.error(
      `[bookings] cancel failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return respond(request, page, { ok: false, reason: "server_error" }, 500);
  }
}
