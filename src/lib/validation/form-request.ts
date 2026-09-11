/**
 * Shared handling for the public form endpoints (`/api/contact`, `/api/testimonials`):
 * body parsing for JSON and HTML forms, honeypot, rate limiting, Zod validation, the
 * no-database 503, and progressive-enhancement redirects for JavaScript-free submissions.
 * Nothing here logs or echoes personal data.
 */
import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { isDatabaseConfigured } from "@/db";
import { clientIpFromHeaders, formRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { HONEYPOT_FIELD } from "./contact";

export type FormFailure =
  | { ok: false; reason: "validation"; errors: Record<string, string[]> }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
  | { ok: false; reason: "not_connected" }
  | { ok: false; reason: "bad_request" }
  | { ok: false; reason: "server_error" };

export type FormResult = { ok: true } | FormFailure;

export interface FormContext {
  /** ISO 3166-1 alpha-2 from the platform edge, when present. */
  region: string | null;
  /** Pathname of the referring page, when it is on this site. */
  sourcePath: string | null;
}

export interface FormHandlerOptions<S extends z.ZodType> {
  schema: S;
  /** Page to send JavaScript-free submissions back to, e.g. `/contact`. */
  redirectPath: string;
  /** Write the validated data. Only called when the database is configured. */
  persist: (data: z.output<S>, ctx: FormContext) => Promise<void>;
  /** Fire the conversion event after a successful write. */
  onSuccess?: (data: z.output<S>) => void;
  rateLimiter?: RateLimiter;
}

type Body = Record<string, unknown>;

/** JSON, `application/x-www-form-urlencoded` and `multipart/form-data` all become one object. */
export async function readBody(request: Request): Promise<Body | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const parsed: unknown = await request.json();
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Body)
        : null;
    }
    if (type.includes("form-urlencoded") || type.includes("multipart/form-data")) {
      const form = await request.formData();
      const out: Body = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") out[key] = value;
      }
      return out;
    }
  } catch {
    return null;
  }
  return null;
}

/** A browser form post: not JSON, and the client prefers an HTML response. */
export function wantsRedirect(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return !type.includes("application/json") && accept.includes("text/html");
}

export function formContext(request: Request): FormContext {
  const region = request.headers.get("x-vercel-ip-country")?.trim().toUpperCase() || null;
  let sourcePath: string | null = null;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const own = new URL(request.url);
      if (url.host === own.host) sourcePath = url.pathname;
    } catch {
      sourcePath = null;
    }
  }
  return { region, sourcePath };
}

/** `{ path: [messages] }` from a Zod error, keyed by the first path segment. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function respond(request: Request, redirectPath: string, result: FormResult, status: number) {
  if (wantsRedirect(request)) {
    const url = new URL(redirectPath, request.url);
    if (result.ok) url.searchParams.set("sent", "1");
    else url.searchParams.set("error", result.reason);
    url.hash = "form";
    return NextResponse.redirect(url, 303);
  }
  const headers: Record<string, string> = { "cache-control": "no-store" };
  if (!result.ok && result.reason === "rate_limited") {
    headers["retry-after"] = String(result.retryAfterSeconds);
  }
  return NextResponse.json(result, { status, headers });
}

/**
 * Run one public form POST end to end. Order: rate limit → body → honeypot → validation →
 * database check → persist → event. A honeypot hit returns success without writing anything,
 * so a bot learns nothing.
 */
export async function handleFormPost<S extends z.ZodType>(
  request: NextRequest,
  options: FormHandlerOptions<S>,
): Promise<NextResponse> {
  const limiter = options.rateLimiter ?? formRateLimiter;
  const limit = limiter.check(clientIpFromHeaders(request.headers));
  if (!limit.ok) {
    const retryAfterSeconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    return respond(
      request,
      options.redirectPath,
      { ok: false, reason: "rate_limited", retryAfterSeconds },
      429,
    );
  }

  const body = await readBody(request);
  if (!body) {
    return respond(request, options.redirectPath, { ok: false, reason: "bad_request" }, 400);
  }

  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return respond(request, options.redirectPath, { ok: true }, 200);
  }

  const parsed = options.schema.safeParse(body);
  if (!parsed.success) {
    return respond(
      request,
      options.redirectPath,
      { ok: false, reason: "validation", errors: fieldErrors(parsed.error) },
      400,
    );
  }

  if (!isDatabaseConfigured()) {
    return respond(request, options.redirectPath, { ok: false, reason: "not_connected" }, 503);
  }

  try {
    await options.persist(parsed.data, formContext(request));
  } catch (error) {
    // Never log the submission; the error class is enough to diagnose a connection problem.
    console.error(
      `[form] persist failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
    return respond(request, options.redirectPath, { ok: false, reason: "server_error" }, 500);
  }

  options.onSuccess?.(parsed.data);
  return respond(request, options.redirectPath, { ok: true }, 200);
}
