/**
 * `GET /api/cron/seo-health` — Vercel Cron, weekly (see `vercel.json`). Guarded by
 * `Authorization: Bearer ${CRON_SECRET}` exactly like the reminders cron. Runs one budgeted
 * segment of the SEO health crawl; a crawl that does not finish in the budget is paused and
 * continues on the next firing (or from the Health page's "Continue" button).
 */
import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { internalOrigin } from "@/lib/markdown/fetch-page";
import { getNotificationEnv } from "@/lib/notifications/env";
import { scorePageCitability } from "@/lib/seo-health/citability";
import { runSeoHealth } from "@/lib/seo-health/runner";
import { getSeoHealthStore } from "@/lib/seo-health/store";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    // Production crawls the canonical site URL; previews and local runs crawl their own host.
    const origin = process.env.NEXT_PUBLIC_SITE_URL
      ? getSiteUrl()
      : internalOrigin(request.headers);
    const result = await runSeoHealth({
      store: getSeoHealthStore(),
      origin,
      trigger: "cron",
      budgetMs: 50_000,
      scoreCitability: scorePageCitability,
    });
    return NextResponse.json({ ok: true, ...result }, { headers });
  } catch (error) {
    console.error(
      `[cron/seo-health] crawl failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500, headers });
  }
}
