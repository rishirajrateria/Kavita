/**
 * Request proxy (Next 16's `proxy.ts`, formerly middleware).
 *
 * First in the chain (Phase 6, P6-B): the redirect engine. Every page request is checked
 * against the in-memory redirect cache (`src/lib/redirects/cache.ts`); a match answers with a
 * 301/302/307/308 (`NextResponse.redirect`) or, for 410, the `/gone` page served with status
 * 410. Hits are counted asynchronously (`POST /api/redirects/hit`, `keepalive`). Requests that
 * pass through carry their pathname in `x-ak-path` so `not-found.tsx` can log 404s.
 *
 * Then three rewrites, all for files whose public name cannot be a static route:
 *
 *   /<path>.md, /index.md          → /api/md            (markdown mirror, CLAUDE.md §9.6)
 *   /<INDEXNOW_KEY>.txt            → /api/indexnow/key  (IndexNow ownership file, §8)
 *   /sitemap-geo-<family>-<n>.xml  → /api/sitemaps/…    (overflow sitemaps beyond 5,000 URLs)
 *   /google….html, /BingSiteAuth.xml → /api/verify      (verification files, §13B)
 *
 * Everything else — including unknown `.txt`/`.xml` names — passes through to normal routing,
 * so the styled 404 page is never replaced. The matcher covers page URLs (not `/api`, `/_next`
 * or static assets by extension) plus the admin routes.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  VERIFICATION_FILE_PATTERN,
  VERIFY_PATH_HEADER,
} from "@/lib/integrations/verification-paths";
import { MD_PATH_HEADER } from "@/lib/markdown/fetch-page";
import { lookupRedirect } from "@/lib/redirects/cache";
import { PATH_HEADER } from "@/lib/redirects/not-found-log";

const OVERFLOW_SITEMAP = /^\/sitemap-geo-(astrology|vastu)-(\d+)\.xml$/;

/**
 * Admin guard (Phase 5, P5-B). `/admin/*` (except the login page) and `/api/admin/*` (except
 * the auth endpoints) need a Supabase session cookie; the proxy also refreshes expiring tokens
 * (Supabase SSR pattern — Server Components cannot write cookies). The role check happens
 * server-side in `requireAdmin()` / `adminRoute()`. When Supabase is not configured the request
 * passes through: the admin layout renders "Not connected" (production) or, outside production
 * with `ADMIN_DEV_BYPASS=true`, a synthetic owner session.
 */
async function guardAdmin(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/admin");
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth/")) {
    return NextResponse.next();
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const hasSessionCookie = request.cookies.getAll().some((c) => /^sb-.*-auth-token/.test(c.name));
  const user = hasSessionCookie ? (await supabase.auth.getUser()).data.user : null;
  if (user) return response;

  if (isApi) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }
  const login = new URL("/admin/login", request.url);
  if (pathname !== "/admin") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

/** Cached HTML of `/gone`, fetched once per instance and served with status 410. */
let goneHtml: { html: string; at: number } | null = null;
const GONE_TTL_MS = 10 * 60_000;
const GONE_FALLBACK =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page removed</title></head><body><h1>This page has been removed</h1><p>It is not coming back. <a href="/">Astrologer Kavita — home</a></p></body></html>';

async function goneResponse(request: NextRequest): Promise<Response> {
  if (!goneHtml || Date.now() - goneHtml.at > GONE_TTL_MS) {
    try {
      const res = await fetch(new URL("/gone", request.url), {
        headers: { accept: "text/html", "x-ak-internal": "gone" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) goneHtml = { html: await res.text(), at: Date.now() };
    } catch {
      /* fall back to the inline page */
    }
  }
  return new Response(goneHtml?.html ?? GONE_FALLBACK, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}

/** Redirect engine branch: `null` when no rule matches. */
async function applyRedirects(request: NextRequest): Promise<Response | null> {
  const { pathname, search } = request.nextUrl;
  const match = await lookupRedirect(pathname);
  if (!match) return null;
  // Count the hit without waiting; the route batches and flushes (`src/lib/redirects/hits.ts`).
  void fetch(new URL("/api/redirects/hit", request.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: match.rule.id }),
    keepalive: true,
  }).catch(() => undefined);
  if (match.statusCode === 410 || !match.destination) return goneResponse(request);
  const target = new URL(match.destination, request.url);
  // Preserve the query string when the destination carries none (tracking parameters survive).
  if (search && !target.search) target.search = search;
  return NextResponse.redirect(target, match.statusCode);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !request.headers.has("x-ak-internal")
  ) {
    // `/gone` itself answers 410 so a crawler that follows the link is told the truth; the
    // internal fetch above (marked `x-ak-internal`) still gets the 200 HTML to cache.
    if (pathname === "/gone") return goneResponse(request);
    const redirected = await applyRedirects(request);
    if (redirected) return redirected;
  }

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin")
  ) {
    return guardAdmin(request);
  }

  if (pathname.endsWith(".md")) {
    const stripped = pathname.slice(0, -".md".length);
    const path = stripped === "/index" || stripped === "" ? "/" : stripped;
    // The handler sees the original URL, not the rewrite's query, so the path travels as a
    // forwarded request header (`MD_PATH_HEADER`); the query is kept for direct calls and logs.
    const target = new URL(`/api/md?path=${encodeURIComponent(path)}`, request.url);
    const headers = new Headers(request.headers);
    headers.set(MD_PATH_HEADER, path);
    return NextResponse.rewrite(target, { request: { headers } });
  }

  const key = process.env.INDEXNOW_KEY?.trim();
  if (key && pathname === `/${key}.txt`) {
    return NextResponse.rewrite(new URL("/api/indexnow/key", request.url));
  }

  // Search-engine verification files (Phase 6, P6-C): /google….html, /BingSiteAuth.xml,
  // /pinterest-….html, /yandex_….html come from `verification_tags`, not from `public/`.
  if (VERIFICATION_FILE_PATTERN.test(pathname)) {
    const target = new URL(`/api/verify?path=${encodeURIComponent(pathname)}`, request.url);
    const verifyHeaders = new Headers(request.headers);
    verifyHeaders.set(VERIFY_PATH_HEADER, pathname);
    return NextResponse.rewrite(target, { request: { headers: verifyHeaders } });
  }

  const overflow = OVERFLOW_SITEMAP.exec(pathname);
  if (overflow) {
    return NextResponse.rewrite(
      new URL(`/api/sitemaps/${overflow[1]}/${overflow[2]}`, request.url),
    );
  }

  // Pass-through: stamp the pathname so `not-found.tsx` can log a 404 for it.
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!api/|_next/|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|css|js|map|json|webmanifest)$).*)",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
