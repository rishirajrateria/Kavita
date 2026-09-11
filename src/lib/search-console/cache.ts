/**
 * 1 h cache for provider responses in `search_performance_cache` (Phase 6, P6-B). The admin
 * page reads through `withPerformanceCache()`; a "refresh" click deletes the rows. A missing
 * database simply means no caching.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { searchPerformanceCache } from "@/db/schema/redirects";
import type { RedirectDb } from "@/lib/redirects/store";

export const PERFORMANCE_CACHE_TTL_MS = 60 * 60_000;

export interface CachedResult<T> {
  value: T;
  fetchedAt: Date;
  cached: boolean;
}

export async function withPerformanceCache<T>(
  provider: "google" | "bing",
  cacheKey: string,
  loader: () => Promise<T>,
  options: { db?: RedirectDb | null; ttlMs?: number; force?: boolean; now?: Date } = {},
): Promise<CachedResult<T>> {
  const db = options.db === undefined ? getDb() : options.db;
  const now = options.now ?? new Date();
  const ttl = options.ttlMs ?? PERFORMANCE_CACHE_TTL_MS;
  if (db && !options.force) {
    const [hit] = await db
      .select()
      .from(searchPerformanceCache)
      .where(
        and(
          eq(searchPerformanceCache.provider, provider),
          eq(searchPerformanceCache.cacheKey, cacheKey),
        ),
      );
    if (hit && hit.expiresAt.getTime() > now.getTime()) {
      return { value: hit.payload as T, fetchedAt: hit.fetchedAt, cached: true };
    }
  }
  const value = await loader();
  if (db) {
    const expiresAt = new Date(now.getTime() + ttl);
    await db
      .insert(searchPerformanceCache)
      .values({ provider, cacheKey, payload: value, fetchedAt: now, expiresAt })
      .onConflictDoUpdate({
        target: [searchPerformanceCache.provider, searchPerformanceCache.cacheKey],
        set: { payload: value, fetchedAt: now, expiresAt },
      });
  }
  return { value, fetchedAt: now, cached: false };
}

export async function clearPerformanceCache(db: RedirectDb | null = getDb()): Promise<void> {
  if (!db) return;
  await db.delete(searchPerformanceCache);
}
