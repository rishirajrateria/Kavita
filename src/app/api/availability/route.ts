/**
 * `GET /api/availability?service=<slug>&month=YYYY-MM&tz=<IANA>` — free slots for a service in a
 * month, grouped by the visitor's local date, every slot as a UTC ISO pair the UI converts into
 * both zones. Works with no database (seed rules, no bookings) so the calendar renders offline.
 */
import type { NextRequest } from "next/server";
import { getAvailability } from "@/lib/booking/availability";
import { availabilityRateLimiter, json, rateLimited } from "@/lib/booking/api";
import { availabilityQuerySchema } from "@/lib/booking/schemas";
import { fieldErrors } from "@/lib/validation/form-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = rateLimited(request, availabilityRateLimiter);
  if (limited) return limited;
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = availabilityQuerySchema.safeParse(params);
  if (!parsed.success) {
    return json({ ok: false, reason: "validation", errors: fieldErrors(parsed.error) }, 400);
  }
  const availability = await getAvailability({
    serviceSlug: parsed.data.service,
    monthISO: parsed.data.month,
    clientTz: parsed.data.tz,
  });
  if (!availability) return json({ ok: false, reason: "unknown_service" }, 404);
  return json({ ok: true, ...availability }, 200, { "cache-control": "private, max-age=60" });
}
