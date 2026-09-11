/**
 * The two-line adapter the existing conversion points use to add a Meta Conversions API send
 * (CLAUDE.md §13C). It exists so `/api/contact`, `/api/bookings` and `/api/track/whatsapp` each
 * change by one call instead of learning about pixels, hashing or logging.
 *
 * Every send is fire-and-forget: `sendMetaConversion` never throws and returns `skipped` when
 * the Conversions API is off, so a booking or contact message is never delayed or lost because
 * an advertising platform is slow. Personal data goes no further than the SHA-256 hash
 * computed inside the sender.
 */
import { metaCookies, sendMetaConversion, type CapiEventInput } from "./meta-capi";

export interface ConversionContext {
  /** The incoming request, for IP, user agent, country and the Meta `_fbp`/`_fbc` cookies. */
  request: Request;
  /** Page the conversion happened on, for `event_source_url`. */
  sourceUrl?: string | null;
}

function ipFrom(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || null;
}

/**
 * Send one conversion to Meta with the same `event_id` the browser pixel used (or will use).
 * Returns immediately; the promise is swallowed by design.
 */
export function sendConversion(
  event: Pick<CapiEventInput, "internalEvent" | "eventId" | "payload">,
  user: Omit<CapiEventInput["user"], "ip" | "userAgent" | "fbp" | "fbc">,
  ctx: ConversionContext,
): void {
  const { fbp, fbc } = metaCookies(ctx.request.headers.get("cookie"));
  void sendMetaConversion({
    ...event,
    user: {
      ...user,
      ip: ipFrom(ctx.request),
      userAgent: ctx.request.headers.get("user-agent"),
      fbp,
      fbc,
    },
    eventSourceUrl: ctx.sourceUrl ?? null,
  }).catch(() => undefined);
}
