/**
 * Redirect hit counting (Phase 6, P6-B). The proxy fires `POST /api/redirects/hit` with
 * `keepalive` and never waits; the route records the hit here. Counts are batched in memory
 * and flushed to `redirects.hit_count` / `last_hit_at` every 30 s (or when the batch grows
 * past `FLUSH_AT`), so a burst of hits costs one UPDATE per rule, not one per request.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { redirects } from "@/db/schema/redirects";

export const HIT_FLUSH_INTERVAL_MS = 30_000;
const FLUSH_AT = 500;

const pending = new Map<string, { count: number; last: Date }>();
let timer: ReturnType<typeof setTimeout> | null = null;

export function recordHit(ruleId: string, at = new Date()): void {
  const entry = pending.get(ruleId);
  if (entry) {
    entry.count += 1;
    entry.last = at;
  } else pending.set(ruleId, { count: 1, last: at });
  if (pending.size >= FLUSH_AT) void flushHits();
  else if (!timer) {
    timer = setTimeout(() => void flushHits(), HIT_FLUSH_INTERVAL_MS);
    timer.unref?.();
  }
}

/** Pending counts by rule id (tests). */
export function pendingHits(): ReadonlyMap<string, { count: number; last: Date }> {
  return pending;
}

/** Write the batch. Safe to call at any time; a missing database keeps the batch for later. */
export async function flushHits(): Promise<number> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending.size === 0) return 0;
  const db = getDb();
  if (!db) return 0;
  const batch = [...pending.entries()];
  pending.clear();
  let flushed = 0;
  for (const [id, { count, last }] of batch) {
    try {
      await db
        .update(redirects)
        .set({ hitCount: sql`${redirects.hitCount} + ${count}`, lastHitAt: last })
        .where(eq(redirects.id, id));
      flushed += count;
    } catch {
      // Put the counts back so the next flush retries them.
      const again = pending.get(id);
      if (again) again.count += count;
      else pending.set(id, { count, last });
    }
  }
  return flushed;
}
