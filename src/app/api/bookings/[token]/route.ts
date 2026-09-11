/**
 * `GET /api/bookings/[token]` — the booking behind a manage token, in both zones, with calendar
 * links; `?format=ics` returns the RFC 5545 file as a download. Never returns birth details,
 * the client's email or phone: the page that calls this already belongs to the client, and a
 * forwarded link must not leak more than the appointment itself.
 */
import type { NextRequest } from "next/server";
import { json, statusFor } from "@/lib/booking/api";
import { buildIcs, calendarLinks, icsUrlFor, manageUrlFor } from "@/lib/booking/ics";
import { getBookingByToken } from "@/lib/booking/manage";
import type { BookingWithRelations } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

export function publicBookingView(relations: BookingWithRelations) {
  const { booking, service, settings } = relations;
  return {
    id: booking.id,
    token: booking.manageToken,
    status: booking.status,
    mode: booking.mode,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    clientTimezone: booking.clientTimezone,
    practitionerTz: settings.timezone,
    service: {
      slug: service.slug,
      name: service.name,
      durationMinutes: service.durationMinutes,
      lead: service.lead,
    },
    rescheduledFromId: booking.rescheduledFromId,
    manageUrl: manageUrlFor(booking),
    icsUrl: icsUrlFor(booking),
    calendar: calendarLinks(booking, service, settings),
  };
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/bookings/[token]">) {
  const { token } = await ctx.params;
  const result = await getBookingByToken(token);
  if (!result.ok) return json(result, statusFor(result.reason));
  if (request.nextUrl.searchParams.get("format") === "ics") {
    const { booking, service, settings } = result.relations;
    return new Response(buildIcs(booking, service, settings), {
      status: 200,
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `attachment; filename="${service.slug}-${booking.id.slice(0, 8)}.ics"`,
        "cache-control": "no-store",
      },
    });
  }
  return json({
    ok: true,
    booking: publicBookingView(result.relations),
    isActive: result.isActive,
    canReschedule: result.canReschedule,
    canCancel: result.canCancel,
    rescheduleDeadline: result.rescheduleDeadline.toISOString(),
    noticeHours: result.noticeHours,
  });
}
