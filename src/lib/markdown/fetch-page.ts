/**
 * Server-side fetch of one of this site's own pages for the markdown mirror. Uses the
 * request's own host so it works on localhost, previews and production alike, and marks the
 * request with `x-md-mirror` so the mirror can never recurse into itself.
 */
import { pageToMarkdown, type PageMarkdown } from "./html-to-markdown";

export const MIRROR_HEADER = "x-md-mirror";
/** Request header carrying the mirrored page path from `src/proxy.ts` to `/api/md`. */
export const MD_PATH_HEADER = "x-md-path";

/** Origin to fetch pages from: the incoming request's own host (proxy headers first). */
export function internalOrigin(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto =
    headers.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

export interface FetchedPage {
  status: number;
  page?: PageMarkdown;
}

/** Fetch and convert a page; `page` is absent when the response is not a 200 HTML document. */
export async function fetchPageMarkdown(origin: string, path: string): Promise<FetchedPage> {
  const response = await fetch(`${origin}${path}`, {
    headers: { [MIRROR_HEADER]: "1", accept: "text/html" },
    // Not the data cache: it persists across deployments (locally and on Vercel), so a redeploy
    // could serve stale markdown for an hour. The page itself is ISR-cached and the responses
    // carry `s-maxage=3600`, so caching happens once, at the CDN.
    cache: "no-store",
  });
  if (!response.ok) return { status: response.status };
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) return { status: 415 };
  return { status: 200, page: pageToMarkdown(await response.text()) };
}
