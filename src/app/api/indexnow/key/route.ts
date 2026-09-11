/**
 * IndexNow key file. Public URL is `/<INDEXNOW_KEY>.txt` — `src/proxy.ts` rewrites it here
 * only when the requested name matches the configured key, so there is no enumeration surface.
 */
import { getIndexNowKey } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export function GET() {
  const key = getIndexNowKey();
  if (!key) return new Response("not found", { status: 404 });
  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
