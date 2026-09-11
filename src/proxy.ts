/**
 * Request proxy (Next 16's `proxy.ts`, formerly middleware). Three rewrites, all for files whose
 * public name cannot be a static route:
 *
 *   /<path>.md, /index.md          → /api/md            (markdown mirror, CLAUDE.md §9.6)
 *   /<INDEXNOW_KEY>.txt            → /api/indexnow/key  (IndexNow ownership file, §8)
 *   /sitemap-geo-<family>-<n>.xml  → /api/sitemaps/…    (overflow sitemaps beyond 5,000 URLs)
 *
 * Everything else — including unknown `.txt`/`.xml` names — passes through to normal routing,
 * so the styled 404 page is never replaced. The matcher is limited to `.md`, `.txt` and `.xml`
 * URLs outside `/api` and `/_next`; pages and assets never run this code.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MD_PATH_HEADER } from "@/lib/markdown/fetch-page";

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const overflow = OVERFLOW_SITEMAP.exec(pathname);
  if (overflow) {
    return NextResponse.rewrite(
      new URL(`/api/sitemaps/${overflow[1]}/${overflow[2]}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/).*\\.(?:md|txt|xml))", "/admin/:path*", "/api/admin/:path*"],
};
