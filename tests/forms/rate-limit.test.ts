import { check, equal } from "../seo-plumbing/_assert";
import { clientIpFromHeaders, createRateLimiter, hashClientKey } from "@/lib/rate-limit";

export function run() {
  let now = 1_000_000;
  const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000, now: () => now });

  for (let i = 0; i < 5; i++) {
    const r = limiter.check("203.0.113.9");
    check(r.ok, `rate-limit: request ${i + 1} of 5 allowed`);
    equal(r.remaining, 4 - i, `rate-limit: remaining after request ${i + 1}`);
  }
  const sixth = limiter.check("203.0.113.9");
  check(!sixth.ok, "rate-limit: 6th request within the window is refused");
  check(sixth.retryAfterMs > 0, "rate-limit: refusal carries a retry delay");

  check(limiter.check("198.51.100.4").ok, "rate-limit: another client is unaffected");

  now += 2 * 60 * 1000 + 1; // one token refills every 2 minutes at 5 per 10 minutes
  check(limiter.check("203.0.113.9").ok, "rate-limit: one token refilled after 2 minutes");
  check(!limiter.check("203.0.113.9").ok, "rate-limit: and only one");

  now += 10 * 60 * 1000;
  const full = limiter.check("203.0.113.9");
  check(full.ok && full.remaining === 4, "rate-limit: bucket full again after a window");

  now += 11 * 60 * 1000;
  limiter.check("192.0.2.1");
  check(limiter.size() <= 2, "rate-limit: idle buckets are swept");

  // Keys are salted hashes, never the IP.
  const key = hashClientKey("203.0.113.9", "salt-a");
  check(!key.includes("203"), "rate-limit: key does not contain the IP");
  check(key !== hashClientKey("203.0.113.9", "salt-b"), "rate-limit: salt changes the key");
  equal(key, hashClientKey("203.0.113.9", "salt-a"), "rate-limit: key is deterministic");

  equal(
    clientIpFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })),
    "203.0.113.9",
    "rate-limit: first x-forwarded-for address",
  );
  equal(
    clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.4" })),
    "198.51.100.4",
    "rate-limit: x-real-ip fallback",
  );
  equal(clientIpFromHeaders(new Headers()), "unknown", "rate-limit: no header → unknown");
}
