/**
 * `POST /api/redirects/refresh` — drop the in-process redirect cache so the next request
 * reloads the rules. Called by the admin mutation routes after every save (and usable from a
 * deploy hook). Authenticated by the shared `REDIRECT_REFRESH_SECRET` (`authorization: Bearer
 * <secret>` or `x-refresh-token`); refused outright when the secret is not configured.
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getRefreshSecret, getRedirectIndex, invalidateRedirectCache } from "@/lib/redirects/cache";
import { invalidateSitemapConfigCache } from "@/lib/redirects/sitemap-config";

export const dynamic = "force-dynamic";

function presented(request: NextRequest): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) return bearer.slice(7).trim();
  return request.headers.get("x-refresh-token");
}

function tokenMatches(given: string | null, secret: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = getRefreshSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, reason: "not_configured", message: "REDIRECT_REFRESH_SECRET is not set" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  if (!tokenMatches(presented(request), secret)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  invalidateRedirectCache();
  invalidateSitemapConfigCache();
  const index = await getRedirectIndex();
  return NextResponse.json(
    { ok: true, rules: index.size, patterns: index.patterns.length },
    { headers: { "cache-control": "no-store" } },
  );
}
