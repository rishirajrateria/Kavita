import { check, equal } from "../seo-plumbing/_assert";
import {
  NoopPaymentProvider,
  initialBookingStatus,
  paymentProviderKeys,
  resolvePaymentProvider,
} from "@/lib/payments";

export async function run() {
  equal(paymentProviderKeys().join(","), "noop", "payments: only noop is registered in v1");
  check(resolvePaymentProvider("razorpay") === null, "payments: unknown provider → null (501)");
  check(resolvePaymentProvider("__proto__") === null, "payments: prototype keys are not providers");
  const noop = new NoopPaymentProvider();
  const intent = await noop.createIntent({
    bookingId: "6f1a2b3c-4d5e-5f60-8a7b-9c0d1e2f3a4b",
    amountMinor: 500000,
    currency: "INR",
    idempotencyKey: "booking:x",
    description: "test",
  });
  equal(intent.bookingStatus, "payment_pending_offline", "payments: noop marks offline payment");
  equal(intent.providerRef, null, "payments: noop has no gateway ref");
  const hook = await noop.verifyWebhook({ rawBody: "{}", headers: new Headers() });
  check(
    !hook.ok && hook.reason === "missing_signature",
    "payments: noop webhook without a signature → missing_signature (401)",
  );
  const signed = await noop.verifyWebhook({
    rawBody: "{}",
    headers: new Headers({ "x-razorpay-signature": "abc" }),
  });
  check(
    !signed.ok && signed.reason === "bad_signature",
    "payments: noop never accepts a signature (401)",
  );
  equal(
    initialBookingStatus({ priceMinor: null, paymentsEnabled: false }),
    "pending",
    "status: on-request → pending",
  );
  equal(
    initialBookingStatus({ priceMinor: 500000, paymentsEnabled: false }),
    "payment_pending_offline",
    "status: priced, payments off",
  );
  equal(
    initialBookingStatus({ priceMinor: 500000, paymentsEnabled: true }),
    "awaiting_payment",
    "status: priced, payments on",
  );
  equal(
    initialBookingStatus({ priceMinor: 500000, paymentsEnabled: true, intentStatus: "paid" }),
    "paid",
    "status: gateway intent wins",
  );
}
