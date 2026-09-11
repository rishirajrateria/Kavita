/**
 * v1 provider: no gateway. `createIntent` records the amount and leaves the booking in
 * `payment_pending_offline` — Kavita collects the fee by bank transfer / UPI and marks it paid in
 * the admin. Webhooks are never valid for this provider (there is nothing to sign them): 401.
 */
import type { PaymentStatus } from "@/db/schema";
import type { PaymentIntent, PaymentIntentInput, PaymentProvider, WebhookInput } from "./types";

export class NoopPaymentProvider implements PaymentProvider {
  readonly key = "noop";

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntent> {
    return {
      provider: this.key,
      providerRef: null,
      status: "pending",
      bookingStatus: "payment_pending_offline",
      checkoutUrl: null,
      clientSecret: null,
      ...(input.amountMinor <= 0 ? { status: "created" as const } : {}),
    };
  }

  async capture(): Promise<PaymentStatus> {
    return "captured";
  }

  async refund(): Promise<PaymentStatus> {
    return "refunded";
  }

  /** Nothing can sign a noop webhook: a missing header is 401 `missing_signature`, any header is
   *  401 `bad_signature`. (Unregistered providers are the 501 case, handled by the route.) */
  async verifyWebhook(input: WebhookInput) {
    const signed = [...input.headers.keys()].some((h) => h.toLowerCase().includes("signature"));
    return {
      ok: false as const,
      reason: signed ? ("bad_signature" as const) : ("missing_signature" as const),
    };
  }
}
