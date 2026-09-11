/**
 * Admin authentication and authorisation (Phase 5, P5-B). Server-only.
 *
 * `getAdminSession()` resolves the signed-in Supabase Auth user (cookie session via
 * `@supabase/ssr`) to its active `admin_users` row. `requireAdmin()` is the page-level guard:
 * it redirects to `/admin/login` when there is no session and to `/admin?denied=1` when the role
 * is too low. Route handlers use `adminRoute()` from `./mutations` instead (JSON errors).
 *
 * Offline development: when Supabase env is absent and `NODE_ENV !== "production"`,
 * `ADMIN_DEV_BYPASS=true` yields a synthetic owner session so the admin UI can be built and
 * screenshotted without a project. The bypass is checked at runtime on every call and can never
 * activate in production — a production deploy without Supabase renders "Not connected".
 */
// No `server-only` marker so the tsx test scripts can import this module; `next/headers` and
// `@/db` already make it unusable from client code.
import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { adminUsers, ADMIN_ROLES, type AdminRole } from "@/db/schema/admin";

export type { AdminRole };
export { ADMIN_ROLES };

export type AdminUser = typeof adminUsers.$inferSelect;

export interface SupabaseUserSummary {
  id: string;
  email: string | null;
}

export interface AdminSession {
  adminUser: AdminUser;
  supabaseUser: SupabaseUserSummary;
  /** True for the synthetic offline session (never in production). */
  bypass: boolean;
}

/** How the admin can authenticate in this deployment. */
export type AdminAuthMode = "supabase" | "bypass" | "not_connected";

/** Numeric rank for role comparisons: viewer < editor < owner. */
export const ROLE_RANK: Record<AdminRole, number> = { viewer: 0, editor: 1, owner: 2 };

export function hasRole(
  session: { adminUser: Pick<AdminUser, "role"> },
  minimum: AdminRole,
): boolean {
  return ROLE_RANK[session.adminUser.role] >= ROLE_RANK[minimum];
}

/** Supabase Auth is usable when the public URL and anon key are both present. */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(supabasePublicEnv());
}

/** Read at call time (not through the cached `getEnv()`), so tests and the proxy agree. */
function supabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}

/**
 * The offline bypass. Runtime check — not a build-time constant — so a production build can
 * never carry it: `NODE_ENV` must not be `production` AND the flag must be exactly `"true"`.
 */
export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ADMIN_DEV_BYPASS === "true";
}

export function getAdminAuthMode(): AdminAuthMode {
  if (isSupabaseAuthConfigured()) return "supabase";
  if (isDevBypassEnabled()) return "bypass";
  return "not_connected";
}

const BYPASS_ADMIN_ID = "00000000-0000-4000-8000-00000000adb1";
const BYPASS_AUTH_ID = "00000000-0000-4000-8000-00000000a0a1";

function bypassSession(): AdminSession {
  const now = new Date(0);
  return {
    bypass: true,
    supabaseUser: { id: BYPASS_AUTH_ID, email: "owner@localhost" },
    adminUser: {
      id: BYPASS_ADMIN_ID,
      authUserId: BYPASS_AUTH_ID,
      email: "owner@localhost",
      displayName: "Local owner (dev bypass)",
      role: "owner",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * A request-scoped Supabase server client over the Next cookie store. In Server Components the
 * cookie store is read-only, so `setAll` swallows the write — the proxy refreshes tokens on
 * every `/admin` request, which is what keeps sessions alive (Supabase SSR pattern).
 */
export async function createSupabaseServerClient() {
  const env = supabasePublicEnv();
  if (!env) return null;
  const store = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* read-only cookie store (Server Component render) — the proxy handles refresh */
        }
      },
    },
  });
}

async function lookupAdminUser(authUserId: string): Promise<AdminUser | null> {
  const db = getDb();
  if (db) {
    const row = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.authUserId, authUserId),
    });
    return row ?? null;
  }
  // No direct Postgres URL: read through PostgREST as the signed-in user. RLS lets an active
  // admin read `admin_users` (`is_admin()`), so a non-admin gets zero rows and is refused.
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, email, display_name, role, is_active, created_at, updated_at")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    authUserId: String(data.auth_user_id),
    email: String(data.email),
    displayName: String(data.display_name),
    role: (ADMIN_ROLES as readonly string[]).includes(String(data.role))
      ? (data.role as AdminRole)
      : "viewer",
    isActive: Boolean(data.is_active),
    createdAt: new Date(String(data.created_at)),
    updatedAt: new Date(String(data.updated_at)),
  };
}

/**
 * The current admin session, or `null`. Memoised per request (`react.cache`) so the layout,
 * page and any nested component share one Supabase round trip.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const mode = getAdminAuthMode();
  if (mode === "not_connected") return null;
  if (mode === "bypass") return bypassSession();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const adminUser = await lookupAdminUser(user.id);
  if (!adminUser || !adminUser.isActive) return null;
  return { adminUser, supabaseUser: { id: user.id, email: user.email ?? null }, bypass: false };
});

export interface RequireAdminOptions {
  /** Minimum role. Defaults to `viewer` (any active admin). */
  role?: AdminRole;
  /** Path to return to after login (defaults to `/admin`). */
  next?: string;
}

/**
 * Page guard. Redirects unauthenticated visitors to `/admin/login` and under-privileged admins
 * to the overview with `?denied=1`. Returns the session otherwise. `redirect()` throws, so code
 * after this call can rely on a session being present.
 */
export async function requireAdmin(options: RequireAdminOptions = {}): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const next = options.next && options.next.startsWith("/admin") ? options.next : "/admin";
    redirect(next === "/admin" ? "/admin/login" : `/admin/login?next=${encodeURIComponent(next)}`);
  }
  if (options.role && !hasRole(session, options.role)) redirect("/admin?denied=1");
  return session;
}

/** Human label for a role, for the header chip and user lists. */
export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    default:
      return "Viewer";
  }
}
