/**
 * The payment seam (CLAUDE.md §11). One interface, implemented once per gateway; the booking
 * engine and the webhook route talk only to this. v1 ships `NoopPaymentProvider`.
 */
import type { BookingStatus, Currency, PaymentStatus } from "@/db/schema";

export interface PaymentIntentInput {
  bookingId: string;
  amountMinor: number;
  currency: Currency;
  /** Stable per booking attempt; gateways de-duplicate on it. */
  idempotencyKey: string;
  description: string;
  /** Contact email for the gateway's receipt; never logged by us. */
  customerEmail?: string;
}

export interface PaymentIntent {
  provider: string;
  /** Gateway id (Razorpay `order_id`, Stripe `pi_…`); null for offline. */
  providerRef: string | null;
  status: PaymentStatus;
  /** What the booking row should be set to after this intent is created. */
  bookingStatus: BookingStatus;
  /** Hosted checkout URL when the gateway provides one. */
  checkoutUrl?: string | null;
  /** Browser-side secret for embedded checkout (Stripe `client_secret`, Razorpay `order_id`). */
  clientSecret?: string | null;
}

export interface WebhookInput {
  /** Raw request body, exactly as received — signatures are computed over these bytes. */
  rawBody: string;
  headers: Headers;
}

export type WebhookVerification =
  | {
      ok: true;
      eventType: string;
      providerRef: string | null;
      /** Mapped onto `payments.status` when the event settles a payment. */
      status: PaymentStatus | null;
      payload: Record<string, unknown>;
    }
  | { ok: false; reason: "missing_signature" | "bad_signature" | "malformed" | "unsupported" };

export interface PaymentProvider {
  /** Registry key and the value written to `payments.provider`. */
  readonly key: string;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntent>;
  capture(providerRef: string, amountMinor?: number): Promise<PaymentStatus>;
  refund(providerRef: string, amountMinor?: number): Promise<PaymentStatus>;
  verifyWebhook(input: WebhookInput): Promise<WebhookVerification>;
}
