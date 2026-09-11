/**
 * `POST /api/consent` — record a visitor's advertising-cookie choice (CLAUDE.md §13E).
 *
 * Body: `{ marketing: boolean, policyVersion?: string }`. The response sets the `ak_consent`
 * cookie (six months, `SameSite=Lax`, not HttpOnly so the banner island can read a stored
 * choice) and appends a row to `consent_log`. The visitor id is the same anonymous, daily-
 * salted hash the cookieless analytics uses — it identifies nobody and cannot be reversed;
 * without a database the cookie is still set, so the choice is honoured either way.
 *
 * `GET` returns the current state (region, whether consent is required, the stored choice) for
 * the admin preview and for debugging. Neither verb is cached.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { consentLog } from "@/db/schema/integrations";
import { visitorHash } from "@/lib/analytics/hash";
import { getConsentConfig } from "@/lib/consent/config";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  consentStateFor,
  readConsentCookie,
  serializeConsentCookie,
} from "@/lib/consent/cookie";
import { normalizeRegion, regionRequiresConsent } from "@/lib/consent/regions";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A visitor makes a handful of choices at most; this only blunts a flood. */
const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

const NO_STORE = { "cache-control": "no-store" } as const;

function regionOf(request: NextRequest): string | null {
  return normalizeRegion(
    request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      request.headers.get("x-ak-country"),
  );
}

export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  if (!limiter.check(ip).ok) {
    return NextResponse.json(
      { ok: false, reason: "rate_limited" },
      { status: 429, headers: NO_STORE },
    );
  }

  let marketing: boolean | null = null;
  try {
    const body = (await request.json()) as { marketing?: unknown };
    if (typeof body.marketing === "boolean") marketing = body.marketing;
  } catch {
    marketing = null;
  }
  if (marketing === null) {
    return NextResponse.json(
      { ok: false, reason: "bad_request" },
      { status: 400, headers: NO_STORE },
    );
  }

  const config = await getConsentConfig();
  const region = regionOf(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  const visitorId = visitorHash(ip, userAgent, new Date());

  const cookie = serializeConsentCookie({
    v: config.policyVersion,
    m: marketing ? "granted" : "denied",
    id: visitorId,
    r: region,
    t: Math.floor(Date.now() / 1000),
  });

  const db = getDb();
  if (db) {
    try {
      await db.insert(consentLog).values({
        visitorId,
        region,
        // The first-party tracker is cookieless and disclosed, never gated — it is always true.
        choices: { analytics: true, marketing },
        policyVersion: config.policyVersion,
        userAgent: userAgent.slice(0, 256),
      });
    } catch {
      // Logging the choice must never stop us honouring it.
    }
  }

  const response = NextResponse.json(
    { ok: true, marketing, region, policyVersion: config.policyVersion },
    { headers: NO_STORE },
  );
  response.cookies.set(CONSENT_COOKIE, cookie, {
    maxAge: CONSENT_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    httpOnly: false,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const config = await getConsentConfig();
  const region = regionOf(request);
  const state = consentStateFor(
    readConsentCookie(request.headers.get("cookie")),
    config.policyVersion,
  );
  return NextResponse.json(
    {
      ok: true,
      region,
      requiresConsent: regionRequiresConsent(region, {
        consentRegions: config.consentRegions,
        unknownRegionRequiresConsent: config.unknownRegionRequiresConsent,
      }),
      consent: state,
      policyVersion: config.policyVersion,
    },
    { headers: NO_STORE },
  );
}
