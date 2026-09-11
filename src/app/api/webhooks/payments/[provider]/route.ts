/**
 * `POST /api/webhooks/payments/[provider]` — gateway webhooks (CLAUDE.md §11). The raw body is
 * read as text BEFORE any parsing because every gateway signs the exact bytes. 501 for a provider
 * that is not registered; 401 when `verifyWebhook` rejects the signature; 200 once verified.
 * Applying the verified event to `payments`/`bookings` is the gateway implementation's job
 * (see the status-mapping table in CLAUDE.md §11); the noop provider never verifies.
 */
import type { NextRequest } from "next/server";
import { json } from "@/lib/booking/api";
import { resolvePaymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/webhooks/payments/[provider]">,
) {
  const { provider: key } = await ctx.params;
  const provider = resolvePaymentProvider(key.toLowerCase());
  if (!provider) return json({ ok: false, reason: "unknown_provider" }, 501);
  const rawBody = await request.text();
  const verification = await provider.verifyWebhook({ rawBody, headers: request.headers });
  if (!verification.ok) {
    const status = verification.reason === "unsupported" ? 501 : 401;
    return json({ ok: false, reason: verification.reason }, status);
  }
  return json({
    ok: true,
    provider: provider.key,
    eventType: verification.eventType,
    providerRef: verification.providerRef,
  });
}
