/**
 * `POST /api/indexnow` — submit URLs to IndexNow. Protected by
 * `Authorization: Bearer ${INDEXNOW_SUBMIT_SECRET}`; the admin (Phase 5/6) calls it after a
 * publish. Body: `{ "urls": ["/astrologer/india", "https://…/about"] }`.
 */
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { INDEXNOW_MAX_URLS, submitIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  urls: z.array(z.string().min(1).max(2048)).min(1).max(INDEXNOW_MAX_URLS),
});

function isAuthorised(request: Request): boolean {
  const secret = process.env.INDEXNOW_SUBMIT_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid body", issues: z.prettifyError(parsed.error) },
      { status: 400 },
    );
  }
  const result = await submitIndexNow(parsed.data.urls);
  const status = result.status === null ? 503 : result.ok ? 200 : 502;
  return Response.json(result, { status });
}
