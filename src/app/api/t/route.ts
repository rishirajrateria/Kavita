/**
 * `POST /api/t` — first-party analytics ingest (CLAUDE.md §13.E, privacy policy "Cookieless
 * analytics"). Always answers 204 with no body, whatever happens: an invalid batch, a rate
 * limit, a missing database or a write failure all look identical from outside, so the
 * endpoint leaks nothing. The raw IP is used only to rate-limit and to derive the daily-salted
 * visitor hash; it is never stored or logged. No GET.
 */
import "server-only";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { geoFromHeaders } from "@/lib/analytics/geo";
import { visitorHash } from "@/lib/analytics/hash";
import { ingestBatch } from "@/lib/analytics/ingest";
import { parseBatch } from "@/lib/analytics/schema";
import { hasHeadlessMarkers, parseUserAgent } from "@/lib/analytics/ua";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 120 batches per minute per client: far above what one browser sends, low enough to blunt floods. */
const limiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

const NO_CONTENT = { status: 204, headers: { "cache-control": "no-store" } } as const;

function siteHost(request: NextRequest): string | null {
  try {
    return new URL(getSiteUrl()).hostname || request.nextUrl.hostname || null;
  } catch {
    return request.nextUrl.hostname || null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    if (!limiter.check(ip).ok) return new Response(null, NO_CONTENT);

    const raw = await request.text();
    const batch = parseBatch(raw);
    if (!batch) return new Response(null, NO_CONTENT);

    const db = getDb();
    if (!db) return new Response(null, NO_CONTENT);

    const userAgent = request.headers.get("user-agent") ?? "";
    const ua = parseUserAgent(userAgent);
    const isBot = ua.isBot || hasHeadlessMarkers(request.headers);
    const now = new Date();
    const geo = geoFromHeaders(request.headers);

    await ingestBatch(db, batch, {
      visitorHash: visitorHash(ip, userAgent, now),
      ...geo,
      deviceType: isBot ? "bot" : ua.deviceType,
      os: ua.os,
      browser: ua.browser,
      isBot,
      siteHost: siteHost(request),
      now,
    });
  } catch (error) {
    // Only the error class: no body, no IP, no path ever reaches the logs.
    console.error(
      `[api/t] ingest failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
  }
  return new Response(null, NO_CONTENT);
}
