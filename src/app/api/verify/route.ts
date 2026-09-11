/**
 * `GET /api/verify?path=/google….html` — serves a search-engine verification FILE from
 * `verification_tags` (CLAUDE.md §13B). The owner pastes the file Google, Bing, Pinterest or
 * Yandex hands out into the admin; it appears at its required root path through the proxy
 * rewrite in `src/proxy.ts`, with no deploy.
 *
 * Only the narrow allow-list in `src/lib/integrations/verification.ts` is servable, so the
 * admin can never publish arbitrary content at the site root. Unknown or disabled paths 404 so
 * the styled 404 page is what a human sees.
 */
import type { NextRequest } from "next/server";
import { getVerificationFile } from "@/lib/integrations/verification";
import {
  VERIFICATION_FILE_PATTERN,
  VERIFY_PATH_HEADER,
} from "@/lib/integrations/verification-paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const path =
    request.headers.get(VERIFY_PATH_HEADER) ?? request.nextUrl.searchParams.get("path") ?? "";
  if (!VERIFICATION_FILE_PATTERN.test(path)) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  const file = await getVerificationFile(path).catch(() => null);
  if (!file) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  return new Response(file.body, {
    status: 200,
    headers: {
      "content-type": file.contentType,
      // Verification files are checked rarely and change almost never.
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-robots-tag": "noindex",
    },
  });
}
