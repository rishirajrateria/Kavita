/**
 * `POST /api/track/whatsapp` — the server half of a WhatsApp-click conversion (CLAUDE.md §13C/D).
 *
 * The pixel fan-out island posts the `event_id` it just used for `fbq('track', …)`; this route
 * sends the same event to the Meta Conversions API under that id, so Meta de-duplicates the
 * browser and server copies instead of counting two. A WhatsApp click carries no contact
 * details, so the only user data sent is the IP, user agent and the `_fbp`/`_fbc` cookies Meta
 * itself set — no email, no phone, nothing hashed from a form.
 *
 * Always answers 204: a disabled Conversions API, a missing database or a Meta outage must be
 * invisible to the visitor, and the endpoint must leak nothing about what is configured.
 */
import type { NextRequest } from "next/server";
import { metaCookies, sendMetaConversion } from "@/lib/integrations/meta-capi";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });
const NO_CONTENT = { status: 204, headers: { "cache-control": "no-store" } } as const;

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    if (!limiter.check(ip).ok) return new Response(null, NO_CONTENT);

    const body = (await request.json().catch(() => ({}))) as {
      eventId?: unknown;
      placement?: unknown;
      path?: unknown;
    };
    const eventId = typeof body.eventId === "string" ? body.eventId.slice(0, 64) : "";
    if (!eventId) return new Response(null, NO_CONTENT);
    const placement = typeof body.placement === "string" ? body.placement.slice(0, 80) : "unknown";
    const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path : "/";

    const { fbp, fbc } = metaCookies(request.headers.get("cookie"));
    await sendMetaConversion({
      internalEvent: "whatsapp_clicked",
      eventId,
      payload: { placement },
      user: {
        ip,
        userAgent: request.headers.get("user-agent"),
        country: request.headers.get("x-vercel-ip-country"),
        fbp,
        fbc,
      },
      eventSourceUrl: new URL(path, getSiteUrl()).toString(),
    });
  } catch {
    // Never surface an advertising failure to a visitor clicking through to WhatsApp.
  }
  return new Response(null, NO_CONTENT);
}
