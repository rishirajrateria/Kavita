/**
 * `POST /api/admin/auth/login` — Supabase email + password. Accepts JSON or a form post; a
 * browser form gets a 303 back to `/admin/login?error=…` or on to `next`. Rate-limited (10 per
 * 10 minutes per client). Sign-in succeeds only for an active `admin_users` row — anyone else
 * is signed out again immediately and told `not_admin`. Never logs the credentials.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getAdminAuthMode, getAdminSession } from "@/lib/admin/auth";
import { readAdminBody, jsonError, jsonOk } from "@/lib/admin/mutations";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
  next: z
    .string()
    .optional()
    .transform((v) => (v && v.startsWith("/admin") ? v : "/admin")),
});

const loginLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

function wantsRedirect(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return (
    !type.includes("application/json") &&
    (request.headers.get("accept") ?? "").includes("text/html")
  );
}

function respond(request: NextRequest, reason: string | null, next: string) {
  if (wantsRedirect(request)) {
    const url = new URL(reason ? "/admin/login" : next, request.url);
    if (reason) {
      url.searchParams.set("error", reason);
      if (next !== "/admin") url.searchParams.set("next", next);
    }
    return NextResponse.redirect(url, 303);
  }
  if (!reason) return jsonOk({ next });
  const status =
    reason === "invalid" || reason === "not_admin"
      ? 401
      : reason === "rate_limited"
        ? 429
        : reason === "bad_request"
          ? 400
          : 500;
  return jsonError(reason === "bad_request" ? "bad_request" : "server_error", { reason }, status);
}

export async function POST(request: NextRequest) {
  if (getAdminAuthMode() !== "supabase") {
    return NextResponse.json({ ok: false, reason: "not_connected" }, { status: 503 });
  }
  const limit = loginLimiter.check(clientIpFromHeaders(request.headers));
  if (!limit.ok) return respond(request, "rate_limited", "/admin");

  const body = await readAdminBody(request);
  const parsed = body ? loginSchema.safeParse(body) : null;
  if (!parsed || !parsed.success) return respond(request, "bad_request", "/admin");
  const { email, password, next } = parsed.data;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return respond(request, "server_error", next);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return respond(request, "invalid", next);

  const session = await getAdminSession();
  if (!session) {
    await supabase.auth.signOut();
    return respond(request, "not_admin", next);
  }
  return respond(request, null, next);
}
