import type { NextRequest } from "next/server";
import { internalOrigin, MIRROR_HEADER } from "@/lib/markdown/fetch-page";
import { buildLlmsFull } from "@/lib/markdown/llms";
import { getSiteUrl } from "@/lib/site";

/**
 * Full-text markdown of the core pages (CLAUDE.md §9.5). Dynamic on purpose: it fetches the
 * site's own pages through the request host, which cannot happen during `next build`; the
 * pages come from the ISR cache and the response carries CDN cache headers.
 */
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.headers.get(MIRROR_HEADER)) {
    return new Response("recursive request", { status: 400 });
  }
  const body = await buildLlmsFull(internalOrigin(request.headers), getSiteUrl());
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
