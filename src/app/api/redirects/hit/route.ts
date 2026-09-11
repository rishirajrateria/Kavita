/**
 * `POST /api/redirects/hit` — count one hit for a redirect rule. Fired by the proxy with
 * `keepalive` and never awaited; the body is `{ id }`. Only ids present in the current redirect
 * index are counted, so the endpoint cannot be used to write arbitrary rows, and the counts are
 * batched in memory and flushed every 30 s (`src/lib/redirects/hits.ts`).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getRedirectIndex } from "@/lib/redirects/cache";
import { recordHit } from "@/lib/redirects/hits";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let id: unknown;
  try {
    id = ((await request.json()) as { id?: unknown }).id;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof id !== "string" || !UUID.test(id)) return new NextResponse(null, { status: 400 });
  const index = await getRedirectIndex();
  const known =
    [...index.exact.values()].some((r) => r.id === id) ||
    index.patterns.some((p) => p.rule.id === id);
  if (known) recordHit(id);
  return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
}
