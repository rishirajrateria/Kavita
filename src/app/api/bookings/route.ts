/**
 * `POST /api/bookings` — create a booking. JSON or HTML-form body (flat fields, see
 * `bookingRequestSchema`), honeypot, rate-limited, 503 `not_connected` without a database.
 * Success: `{ ok, token, booking: { id, startsAt, endsAt, status, clientTimezone, practitionerTz,
 * mode, serviceSlug }, manageUrl, icsUrl, calendar: { google, outlook, apple } }`.
 * Failure reasons: validation (400, +errors) · rate_limited (429) · unknown_service (404) ·
 * mode_unavailable / slot_unavailable / slot_taken (409, the last two with `alternatives`) ·
 * not_connected / encryption_unavailable (503).
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
import { createBooking } from "@/lib/booking/create";
import { calendarLinks, icsUrlFor, manageUrlFor } from "@/lib/booking/ics";
import { sendConversion } from "@/lib/integrations/capi-events";
import { bookingEventId } from "@/lib/integrations/event-ids";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = rateLimited(request, bookingRateLimiter);
  if (limited) return limited;
  const body = await readBody(request);
  if (!body) return respond(request, "/book", { ok: false, reason: "bad_request" }, 400);
  if (honeypotHit(body)) return respond(request, "/book", { ok: true }, 200, "/book");

  let result;
  try {
    result = await createBooking(body);
  } catch (error) {
    console.error(
      `[bookings] create failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return respond(request, "/book", { ok: false, reason: "server_error" }, 500);
  }
  if (!result.ok) {
    // Validation runs before the database check so a form gets field errors even offline.
    if (result.reason !== "validation" && !isDatabaseConfigured()) {
      return respond(request, "/book", { ok: false, reason: "not_connected" }, 503);
    }
    return respond(request, "/book", result, statusFor(result.reason));
  }
  const { booking, client, service, settings } = result.relations;
  const manageUrl = manageUrlFor(booking);
  // Meta Conversions API (CLAUDE.md §13C): the id is derived from the booking id, and the
  // browser pixel derives the same one from the receipt, so Meta counts one conversion.
  sendConversion(
    {
      internalEvent: "booking_completed",
      eventId: bookingEventId(booking.id),
      payload: {
        serviceSlug: service.slug,
        currency: service.currency ?? undefined,
        amountMinor: service.priceMinor ?? undefined,
      },
    },
    {
      email: client.email,
      phone: client.phone,
      firstName: client.fullName.split(" ")[0] ?? null,
      country: request.headers.get("x-vercel-ip-country"),
    },
    { request, sourceUrl: request.headers.get("referer") },
  );
  return respond(
    request,
    "/book",
    {
      ok: true,
      token: booking.manageToken,
      booking: {
        id: booking.id,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        status: booking.status,
        mode: booking.mode,
        clientTimezone: booking.clientTimezone,
        practitionerTz: settings.timezone,
        serviceSlug: service.slug,
        serviceName: service.name,
      },
      manageUrl,
      icsUrl: icsUrlFor(booking),
      calendar: calendarLinks(booking, service, settings),
    },
    201,
    `/booking/${booking.manageToken}`,
  );
}
