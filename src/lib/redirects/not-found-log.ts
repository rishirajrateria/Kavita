/**
 * 404 log (Phase 6, P6-B). `src/app/not-found.tsx` calls `logNotFound()` with the request
 * headers; the proxy stamps the pathname onto every page request as `x-ak-path`. Writes are
 * fire-and-forget, deduplicated per path per minute in memory, and store only the origin of
 * the referrer — never a query string, never a visitor identity.
 */
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notFoundLog, redirects } from "@/db/schema/redirects";
import { normalisePathname } from "./matchers";
import type { RedirectDb } from "./store";

export const PATH_HEADER = "x-ak-path";
const DEDUPE_MS = 60_000;
const MAX_PATH = 512;
const recent = new Map<string, number>();

/** Anything that is clearly not a page (asset probes, source maps, well-known scans). */
const IGNORED = /\.(?:php|asp|aspx|jsp|cgi|env|git|map|ico|png|jpe?g|webp|svg|css|js|txt|xml)$/i;

export function shouldLogPath(path: string): boolean {
  if (path === "/" || path.length > MAX_PATH) return false;
  if (path.startsWith("/_next") || path.startsWith("/api/") || path.startsWith("/admin"))
    return false;
  if (path.startsWith("/.well-known") || IGNORED.test(path)) return false;
  return true;
}

export function referrerOrigin(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).origin;
  } catch {
    return null;
  }
}

/** Path from the proxy header, falling back to nothing (never guess from `referer`). */
export function pathFromHeaders(headers: Headers): string | null {
  const raw = headers.get(PATH_HEADER);
  return raw ? normalisePathname(raw) : null;
}

/** Record a 404 for the request. Returns `false` when it was ignored or deduplicated. */
export function logNotFound(headers: Headers, now = Date.now()): boolean {
  const path = pathFromHeaders(headers);
  if (!path || !shouldLogPath(path)) return false;
  const last = recent.get(path);
  if (last && now - last < DEDUPE_MS) return false;
  recent.set(path, now);
  if (recent.size > 5000) {
    for (const [key, at] of recent) if (now - at > DEDUPE_MS) recent.delete(key);
  }
  const referrer = referrerOrigin(headers.get("referer"));
  void upsertNotFound(path, referrer).catch(() => undefined);
  return true;
}

export async function upsertNotFound(
  path: string,
  referrer: string | null,
  db: RedirectDb | null = getDb(),
): Promise<void> {
  if (!db) return;
  await db
    .insert(notFoundLog)
    .values({ path, lastReferrer: referrer })
    .onConflictDoUpdate({
      target: notFoundLog.path,
      set: {
        hits: sql`${notFoundLog.hits} + 1`,
        lastSeen: new Date(),
        lastReferrer: referrer ?? sql`${notFoundLog.lastReferrer}`,
      },
    });
}

export interface NotFoundRow {
  id: string;
  path: string;
  hits: number;
  firstSeen: Date;
  lastSeen: Date;
  lastReferrer: string | null;
  resolvedAt: Date | null;
  /** True when an active redirect already exists for this exact path. */
  redirected: boolean;
}

export async function listNotFound(
  limit = 200,
  includeResolved = false,
  db: RedirectDb | null = getDb(),
): Promise<NotFoundRow[]> {
  if (!db) return [];
  const rows = await db
    .select()
    .from(notFoundLog)
    .where(includeResolved ? undefined : sql`${notFoundLog.resolvedAt} is null`)
    .orderBy(desc(notFoundLog.hits), desc(notFoundLog.lastSeen))
    .limit(limit);
  if (rows.length === 0) return [];
  const active = await db
    .select({ fromPath: redirects.fromPath })
    .from(redirects)
    .where(eq(redirects.isActive, true));
  const covered = new Set(active.map((r) => normalisePathname(r.fromPath)));
  return rows.map((r) => ({ ...r, redirected: covered.has(r.path) }));
}

export async function markNotFoundResolved(
  path: string,
  db: RedirectDb | null = getDb(),
): Promise<void> {
  if (!db) return;
  await db
    .update(notFoundLog)
    .set({ resolvedAt: new Date() })
    .where(eq(notFoundLog.path, normalisePathname(path)));
}

export async function deleteNotFound(
  id: string,
  db: RedirectDb | null = getDb(),
): Promise<boolean> {
  if (!db) return false;
  const rows = await db
    .delete(notFoundLog)
    .where(eq(notFoundLog.id, id))
    .returning({ id: notFoundLog.id });
  return rows.length > 0;
}
