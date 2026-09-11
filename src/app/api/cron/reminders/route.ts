/**
 * `GET /api/cron/reminders` — Vercel Cron (every 15 minutes, see `vercel.json`). Guarded by
 * `Authorization: Bearer ${CRON_SECRET}`; a request without the exact bearer is refused before
 * anything is read. Sends the 24-hour and 1-hour client reminders due in this window, once each
 * (the notification log deduplicates), and returns `{ checked, sent, skipped }`.
 */
import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getNotificationEnv } from "@/lib/notifications/env";
import { runReminderSweep } from "@/lib/notifications/sweep";

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
  const secret = getNotificationEnv().CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503, headers });
  }
  if (!bearerMatches(authorization, secret)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers });
  }

  try {
    const result = await runReminderSweep(new Date());
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error(
      `[cron/reminders] sweep failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500, headers });
  }
}
