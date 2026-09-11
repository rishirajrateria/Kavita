/** The `/admin` proxy guard: pass-through without Supabase, redirect / 401 without a session. */
import { NextRequest } from "next/server";
import { check, equal } from "../seo-plumbing/_assert";
import { proxy } from "@/proxy";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

export async function run() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const passthrough = await proxy(request("/admin/traffic"));
  check(
    !passthrough.headers.get("location"),
    "no Supabase → admin passes through (layout shows Not connected)",
  );

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-tests";

  const redirected = await proxy(request("/admin/traffic?range=7d"));
  equal(redirected.status, 307, "no session cookie → redirect");
  const location = new URL(redirected.headers.get("location") ?? "", "http://localhost:3000");
  equal(location.pathname, "/admin/login", "redirects to login");
  equal(location.searchParams.get("next"), "/admin/traffic", "carries next path");

  const root = await proxy(request("/admin"));
  const rootLoc = new URL(root.headers.get("location") ?? "", "http://localhost:3000");
  equal(rootLoc.searchParams.get("next"), null, "root admin redirect has no next");

  const login = await proxy(request("/admin/login"));
  check(!login.headers.get("location"), "login page is not guarded");

  const api = await proxy(request("/api/admin/bookings"));
  equal(api.status, 401, "api without session → 401");
  equal(((await api.json()) as { reason: string }).reason, "unauthorized", "api 401 body");

  const authApi = await proxy(request("/api/admin/auth/login"));
  check(
    !authApi.headers.get("location") && authApi.status === 200,
    "auth endpoints are not guarded",
  );

  const md = await proxy(request("/about.md"));
  check(
    md.headers.get("x-middleware-rewrite")?.includes("/api/md") ?? false,
    "markdown rewrite still works",
  );

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
