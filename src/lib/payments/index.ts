/**
 * Provider registry and the `PAYMENTS_ENABLED` gate. Adding a gateway = one class implementing
 * `PaymentProvider`, one line in `PROVIDERS`, its keys in `.env.example` — see CLAUDE.md §11.
 */
import type { BookingStatus } from "@/db/schema";
import { getEnv } from "@/lib/env";
import { NoopPaymentProvider } from "./noop";
import type { PaymentProvider } from "./types";

export type {
  PaymentIntent,
  PaymentIntentInput,
  PaymentProvider,
  WebhookInput,
  WebhookVerification,
} from "./types";
export { NoopPaymentProvider } from "./noop";

const PROVIDERS: Record<string, () => PaymentProvider> = {
  noop: () => new NoopPaymentProvider(),
  // razorpay: () => new RazorpayPaymentProvider(),   // CLAUDE.md §11 step 2
  // stripe: () => new StripePaymentProvider(),
};

export function isPaymentsEnabled(): boolean {
  return getEnv().PAYMENTS_ENABLED === "true";
}

/** Registered provider keys — the only values accepted by `/api/webhooks/payments/[provider]`. */
export function paymentProviderKeys(): string[] {
  return Object.keys(PROVIDERS);
}

/** A provider by key, or `null` when unknown (the webhook route answers 501). */
export function resolvePaymentProvider(key: string): PaymentProvider | null {
  const factory = Object.prototype.hasOwnProperty.call(PROVIDERS, key) ? PROVIDERS[key] : undefined;
  return factory ? factory() : null;
}

/**
 * The provider bookings use: `PAYMENT_PROVIDER` from the env when payments are enabled, else the
 * noop provider. An unknown key falls back to noop rather than failing a booking.
 */
export function getPaymentProvider(
  env: Record<string, string | undefined> = process.env,
): PaymentProvider {
  if (!isPaymentsEnabled()) return new NoopPaymentProvider();
  const key = env.PAYMENT_PROVIDER?.trim().toLowerCase() || "noop";
  return resolvePaymentProvider(key) ?? new NoopPaymentProvider();
}

/**
 * Initial booking status (decision documented in CLAUDE.md §11):
 *  - service has no price ("on request"): `pending` — nothing to collect until Kavita quotes;
 *  - priced, payments off (v1): `payment_pending_offline` — fee collected outside the site;
 *  - priced, payments on: whatever the gateway's `createIntent` says (`awaiting_payment`).
 */
export function initialBookingStatus(input: {
  priceMinor: number | null;
  paymentsEnabled: boolean;
  intentStatus?: BookingStatus;
}): BookingStatus {
  if (input.priceMinor === null || input.priceMinor <= 0) return "pending";
  if (!input.paymentsEnabled) return "payment_pending_offline";
  return input.intentStatus ?? "awaiting_payment";
}
