/**
 * `POST /api/admin/auth/logout` — ends the Supabase session (cookies cleared through the SSR
 * client) and sends the browser to `/admin/login`. Also `GET`, so a plain link works.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

async function signOut(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  const url = new URL("/admin/login?error=signed_out", request.url);
  const response = NextResponse.redirect(url, 303);
  // Belt and braces: drop any Supabase auth cookie the client did not clear.
  for (const cookie of request.cookies.getAll()) {
    if (/^sb-.*-auth-token/.test(cookie.name)) response.cookies.delete(cookie.name);
  }
  return response;
}

export const POST = signOut;
export const GET = signOut;
