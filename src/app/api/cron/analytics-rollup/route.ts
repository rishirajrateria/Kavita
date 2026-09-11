/**
 * `GET /api/cron/analytics-rollup` — Vercel Cron (hourly, see `vercel.json`). Guarded by
 * `Authorization: Bearer ${CRON_SECRET}` exactly like `/api/cron/reminders`. Rolls up today,
 * yesterday and any day with raw data not yet rolled, deletes raw rows older than 90 days and
 * returns the counts. Without a database it answers 503 `not_connected`.
 */
import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { runRollup } from "@/lib/analytics/rollup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerMatches(header: string | null, secret: string): boolean {
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token.length === 0) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const headers = { "cache-control": "no-store" };
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers });
  }
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503, headers });
  }
  if (!bearerMatches(authorization, secret)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, reason: "not_connected" }, { status: 503, headers });
  }
  try {
    const result = await runRollup(db, new Date());
    return NextResponse.json({ ok: true, ...result }, { headers });
  } catch (error) {
    console.error(
      `[cron/analytics-rollup] failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500, headers });
  }
}
