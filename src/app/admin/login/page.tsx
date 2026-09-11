/**
 * `/admin/login` — email + password via `POST /api/admin/auth/login` (a plain HTML form, so
 * it works without JavaScript; the handler answers with a redirect). Signed-in admins are sent
 * straight to the panel; without Supabase the "Not connected" state is shown instead.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VastuCompass } from "@/components/motifs";
import { NotConnected } from "@/components/admin/shell/not-connected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminAuthMode, getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid: "That email and password combination was not accepted.",
  not_admin: "This account is not an active admin user.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
  bad_request: "Enter your email address and password.",
  server_error: "Sign-in failed. Try again in a moment.",
  signed_out: "You have been signed out.",
};

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const mode = getAdminAuthMode();
  if (mode === "not_connected") return <NotConnected title="Sign-in not available" />;
  const params = await searchParams;
  const next =
    typeof params.next === "string" && params.next.startsWith("/admin") ? params.next : "/admin";
  if (await getAdminSession()) redirect(next);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <div className="admin-root flex min-h-dvh items-center justify-center bg-background px-gutter py-16 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <VastuCompass
            decorative
            hideLabels
            strokeWidth={1}
            className="mx-auto mb-4 size-12 text-accent-strong"
          />
          <h1 className="font-serif text-3xl font-medium tracking-tight">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Astrologer Kavita — practice panel</p>
        </div>
        <form
          method="post"
          action="/api/admin/auth/login"
          className="double-rule flex flex-col gap-4 rounded-xl border border-accent-border/50 bg-card p-6 shadow-sm"
        >
          <input type="hidden" name="next" value={next} />
          {error ? (
            <p role="alert" className="rounded-md bg-error-soft px-3 py-2 text-sm text-error">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" variant="gold" size="lg" className="mt-2">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
