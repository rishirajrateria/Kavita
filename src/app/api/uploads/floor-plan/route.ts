/**
 * `POST /api/uploads/floor-plan` — multipart field `file`, ≤ 10 MB, PDF/PNG/JPEG/WebP decided by
 * magic bytes, stored in the private Supabase bucket `floor-plans` with the service role.
 * 201 `{ ok, storagePath, contentType, bytes }`; 400 `bad_request` / `unsupported_type` /
 * `too_large`; 429; 503 `not_connected` when Storage is not configured.
 */
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { floorPlans } from "@/db/schema";
import { bookingRateLimiter, json, rateLimited } from "@/lib/booking/api";
import {
  FLOOR_PLAN_BUCKET,
  FLOOR_PLAN_MAX_BYTES,
  floorPlanPath,
  sniffFloorPlan,
} from "@/lib/storage/floor-plans";
import { isStorageConfigured, uploadPrivateObject } from "@/lib/storage/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = rateLimited(request, bookingRateLimiter);
  if (limited) return limited;
  if (!isStorageConfigured()) return json({ ok: false, reason: "not_connected" }, 503);
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > FLOOR_PLAN_MAX_BYTES + 4096) return json({ ok: false, reason: "too_large" }, 400);

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    file = entry instanceof File ? entry : null;
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  if (!file || file.size === 0) return json({ ok: false, reason: "bad_request" }, 400);
  if (file.size > FLOOR_PLAN_MAX_BYTES) return json({ ok: false, reason: "too_large" }, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffFloorPlan(bytes);
  if (!kind) return json({ ok: false, reason: "unsupported_type" }, 400);

  const storagePath = floorPlanPath(kind);
  try {
    await uploadPrivateObject({
      bucket: FLOOR_PLAN_BUCKET,
      path: storagePath.slice(FLOOR_PLAN_BUCKET.length + 1),
      bytes,
      contentType: kind.contentType,
    });
    const db = getDb();
    if (db) {
      await db
        .insert(floorPlans)
        .values({ storagePath, contentType: kind.contentType, bytes: bytes.length });
    }
  } catch (error) {
    console.error(
      `[uploads] floor plan failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return json({ ok: false, reason: "server_error" }, 500);
  }
  return json({ ok: true, storagePath, contentType: kind.contentType, bytes: bytes.length }, 201);
}
