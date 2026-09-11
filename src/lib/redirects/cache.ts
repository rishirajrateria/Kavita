/**
 * In-memory redirect cache (Phase 6, P6-B). The proxy consults it on every page request, so
 * the lookup is a Map hit for exact rules plus a linear scan of the (few) pattern rules —
 * unit-tested at < 5 ms with 5,000 rules in `tests/redirects/cache.test.ts`.
 *
 * Loading is lazy (first lookup), refreshed on a 60 s TTL and on demand via
 * `POST /api/redirects/refresh` (called by the admin mutation routes). No database → an empty
 * index that is re-checked on the next TTL tick, so a site without Supabase never redirects.
 *
 * `buildRedirectIndex()` and `lookupInIndex()` are pure and shared with the tests.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { redirects } from "@/db/schema/redirects";
import {
  compilePatternRule,
  normalisePathname,
  resolveDestination,
  type CompiledPatternRule,
  type RedirectMatch,
  type RedirectRule,
} from "./matchers";

export const REDIRECT_CACHE_TTL_MS = 60_000;

export interface RedirectIndex {
  exact: Map<string, RedirectRule>;
  patterns: CompiledPatternRule[];
  size: number;
  loadedAt: number;
}

export function buildRedirectIndex(
  rules: readonly RedirectRule[],
  now = Date.now(),
): RedirectIndex {
  const exact = new Map<string, RedirectRule>();
  const patterns: CompiledPatternRule[] = [];
  for (const rule of rules) {
    if (rule.matchType === "exact") {
      exact.set(normalisePathname(rule.fromPath), rule);
      continue;
    }
    const compiled = compilePatternRule(rule);
    if (compiled) patterns.push(compiled);
  }
  return { exact, patterns, size: rules.length, loadedAt: now };
}

/** Exact rules win; pattern rules are tried in insertion order (oldest first). */
export function lookupInIndex(index: RedirectIndex, pathname: string): RedirectMatch | null {
  const path = normalisePathname(pathname);
  const exact = index.exact.get(path);
  if (exact) {
    return { rule: exact, destination: resolveDestination(exact), statusCode: exact.statusCode };
  }
  for (const { rule, regex } of index.patterns) {
    const m = regex.exec(path);
    if (!m) continue;
    return {
      rule,
      destination: resolveDestination(rule, m.slice(1)),
      statusCode: rule.statusCode,
    };
  }
  return null;
}

let current: RedirectIndex | null = null;
let loading: Promise<RedirectIndex> | null = null;

async function loadFromDatabase(): Promise<RedirectIndex> {
  const db = getDb();
  if (!db) return buildRedirectIndex([]);
  const rows = await db
    .select({
      id: redirects.id,
      fromPath: redirects.fromPath,
      toPath: redirects.toPath,
      matchType: redirects.matchType,
      statusCode: redirects.statusCode,
    })
    .from(redirects)
    .where(and(eq(redirects.isActive, true)))
    .orderBy(redirects.createdAt);
  return buildRedirectIndex(rows);
}

/** The current index, loading or refreshing it when stale. Never throws: a failed load keeps
 *  the previous index (or an empty one) and is retried after the TTL. */
export async function getRedirectIndex(now = Date.now()): Promise<RedirectIndex> {
  if (current && now - current.loadedAt < REDIRECT_CACHE_TTL_MS) return current;
  if (!loading) {
    loading = loadFromDatabase()
      .catch((error: unknown) => {
        console.error(
          `[redirects] cache load failed: ${error instanceof Error ? error.name : "unknown"}`,
        );
        return current ?? buildRedirectIndex([], now);
      })
      .then((index) => {
        current = { ...index, loadedAt: now };
        loading = null;
        return current;
      });
  }
  return current ?? loading;
}

/** Drop the cached index so the next lookup reloads. Called by the refresh route. */
export function invalidateRedirectCache(): void {
  current = null;
  loading = null;
}

/** Proxy entry point. */
export async function lookupRedirect(pathname: string): Promise<RedirectMatch | null> {
  const index = await getRedirectIndex();
  if (index.size === 0) return null;
  return lookupInIndex(index, pathname);
}

/** Reads the shared refresh secret; the refresh route refuses when it is unset. */
export function getRefreshSecret(): string | undefined {
  const value = process.env.REDIRECT_REFRESH_SECRET?.trim();
  return value && value.length >= 16 ? value : undefined;
}
