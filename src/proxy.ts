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
import { NextResponse, type NextRequest } from "next/server";
import { MD_PATH_HEADER } from "@/lib/markdown/fetch-page";

const OVERFLOW_SITEMAP = /^\/sitemap-geo-(astrology|vastu)-(\d+)\.xml$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!api/|_next/).*\\.(?:md|txt|xml))"],
};
