/**
 * Markdown mirror (CLAUDE.md §9.6): `GET /api/md?path=/about` returns the page as clean
 * markdown. Public URLs are `/{path}.md` (and `/index.md` for the home page); `src/proxy.ts`
 * rewrites them here with the path in `MD_PATH_HEADER`. Dynamic (reads request headers): the
 * page is fetched fresh from the ISR cache and the response carries CDN cache headers.
 */
import type { NextRequest } from "next/server";
import {
  fetchPageMarkdown,
  internalOrigin,
  MD_PATH_HEADER,
  MIRROR_HEADER,
} from "@/lib/markdown/fetch-page";
import { renderMarkdownDocument } from "@/lib/markdown/html-to-markdown";
import { isIndexable, normalisePath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export const runtime = "nodejs";

const SAFE_PATH = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(request: NextRequest) {
  if (request.headers.get(MIRROR_HEADER)) return text("recursive mirror request", 400);

  const requested =
    request.headers.get(MD_PATH_HEADER) ?? request.nextUrl.searchParams.get("path") ?? "";
  const path = normalisePath(requested);
  if (!SAFE_PATH.test(path) || !isIndexable(path)) return text("not found", 404);

  const result = await fetchPageMarkdown(internalOrigin(request.headers), path);
  if (!result.page) return text("not found", result.status === 200 ? 404 : result.status);

  const source = absoluteUrl(path);
  return new Response(
    renderMarkdownDocument({ ...result.page, canonical: result.page.canonical ?? source }, source),
    {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
        Link: `<${source}>; rel="canonical"`,
      },
    },
  );
}
