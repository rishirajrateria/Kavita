/**
 * In-memory token bucket for the public form endpoints. Keyed by a salted SHA-256 of the client
 * IP (the raw IP is never stored). Per-instance by design: on Vercel each serverless instance
 * keeps its own map, so the limit is a nuisance filter against naive floods, not a hard quota.
 * A shared store (Upstash/Redis) can replace the `Map` behind the same interface later.
 */
import { createHash } from "node:crypto";

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Salt mixed into the key hash; defaults to a per-process random value. */
  salt?: string;
  /** Injectable clock for tests. */
  now?: () => number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Milliseconds until the bucket has room again (0 when `ok`). */
  retryAfterMs: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

const processSalt = createHash("sha256")
  .update(`${process.pid}:${Date.now()}:${Math.random()}`)
  .digest("hex");

export function hashClientKey(ip: string, salt: string = processSalt): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** First address in `x-forwarded-for` (the client, as set by the platform edge), else `x-real-ip`. */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function createRateLimiter(options: Partial<RateLimitOptions> = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now;
  const salt = options.salt ?? processSalt;
  const refillPerMs = limit / windowMs;
  const buckets = new Map<string, Bucket>();
  let lastSweep = now();

  /** Drop buckets that have fully refilled, so the map cannot grow without bound. */
  function sweep(t: number) {
    if (t - lastSweep < windowMs) return;
    lastSweep = t;
    for (const [key, bucket] of buckets) {
      if (t - bucket.updatedAt >= windowMs) buckets.delete(key);
    }
  }

  return {
    /** Consume one token for `ip`. */
    check(ip: string): RateLimitResult {
      const t = now();
      sweep(t);
      const key = hashClientKey(ip, salt);
      const bucket = buckets.get(key) ?? { tokens: limit, updatedAt: t };
      const refilled = Math.min(limit, bucket.tokens + (t - bucket.updatedAt) * refillPerMs);
      if (refilled >= 1) {
        buckets.set(key, { tokens: refilled - 1, updatedAt: t });
        return { ok: true, remaining: Math.floor(refilled - 1), retryAfterMs: 0 };
      }
      buckets.set(key, { tokens: refilled, updatedAt: t });
      return { ok: false, remaining: 0, retryAfterMs: Math.ceil((1 - refilled) / refillPerMs) };
    },
    /** Number of tracked keys — for tests and diagnostics only. */
    size(): number {
      return buckets.size;
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/** Shared limiter for the two public form endpoints: 5 requests per 10 minutes per client. */
export const formRateLimiter = createRateLimiter({
  limit: DEFAULT_LIMIT,
  windowMs: DEFAULT_WINDOW_MS,
});
