import { check, equal } from "../seo-plumbing/_assert";
import {
  MANAGE_TOKEN_TTL_DAYS,
  isTokenSigningConfigured,
  manageTokenExpiry,
  signManageToken,
  verifyManageToken,
} from "@/lib/booking/tokens";

export function run() {
  const secret = "test-secret-at-least-16-chars";
  const id = "6f1a2b3c-4d5e-5f60-8a7b-9c0d1e2f3a4b";
  const now = new Date("2026-10-01T00:00:00Z");
  const expiresAt = manageTokenExpiry(now);
  equal(
    expiresAt.toISOString(),
    "2026-10-31T00:00:00.000Z",
    `tokens: expiry is ${MANAGE_TOKEN_TTL_DAYS} days`,
  );

  const token = signManageToken(id, expiresAt, secret);
  check(/^[A-Za-z0-9._-]+$/.test(token), "tokens: URL-safe alphabet");
  check(!token.includes(id), "tokens: booking id is encoded, not bare");
  const ok = verifyManageToken(token, { now, secret });
  check(ok.ok && ok.bookingId === id, "tokens: round-trip returns the booking id");
  check(
    ok.ok && ok.expiresAt.getTime() === expiresAt.getTime(),
    "tokens: round-trip returns expiry",
  );

  const late = verifyManageToken(token, { now: new Date("2026-10-31T00:00:01Z"), secret });
  check(!late.ok && late.reason === "expired", "tokens: expired after 30 days");
  const wrongSecret = verifyManageToken(token, { now, secret: "another-secret-16-chars!" });
  check(!wrongSecret.ok && wrongSecret.reason === "bad_signature", "tokens: wrong secret rejected");
  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
  check(!verifyManageToken(tampered, { now, secret }).ok, "tokens: tampered signature rejected");
  const payloadTampered = token.split(".");
  payloadTampered[1] = Buffer.from(`${id}.9999999999`).toString("base64url");
  check(
    !verifyManageToken(payloadTampered.join("."), { now, secret }).ok,
    "tokens: extended expiry rejected",
  );
  for (const bad of ["", "abc", "v1.x", "v2.a.b", "v1..", "v1.a b.c", "../etc"]) {
    const r = verifyManageToken(bad, { now, secret });
    check(!r.ok && r.reason === "malformed", `tokens: malformed "${bad}"`);
  }
  check(signManageToken(id, expiresAt, secret) === token, "tokens: deterministic for same inputs");
  check(!isTokenSigningConfigured({}), "tokens: unconfigured without BOOKING_TOKEN_SECRET");
  check(isTokenSigningConfigured({ BOOKING_TOKEN_SECRET: secret }), "tokens: configured");
  let threw = false;
  try {
    signManageToken("not-a-uuid", expiresAt, secret);
  } catch {
    threw = true;
  }
  check(threw, "tokens: refuses a non-UUID id");
}
