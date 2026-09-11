/**
 * Rendered in place of the admin when Supabase Auth is not configured. There is no bypass in
 * production — this page is the only thing a deploy without Supabase shows under `/admin`.
 */
import { VastuCompass } from "@/components/motifs";

export function NotConnected({ title = "Admin not connected" }: { title?: string }) {
  const dev = process.env.NODE_ENV !== "production";
  return (
    <div className="admin-root flex min-h-dvh items-center justify-center bg-background px-gutter py-16 text-foreground">
      <div className="double-rule max-w-md rounded-xl border border-accent-border/50 bg-card p-8 text-center shadow-sm">
        <VastuCompass
          decorative
          hideLabels
          strokeWidth={1}
          className="mx-auto mb-5 size-12 text-accent-strong"
        />
        <h1 className="font-serif text-2xl font-medium tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
          <code>SUPABASE_DB_URL</code>, then add the owner to <code>admin_users</code> to sign in.
        </p>
        {dev ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Offline development: <code>ADMIN_DEV_BYPASS=true</code> opens the panel with a synthetic
            owner session. It never applies to production builds.
          </p>
        ) : null}
      </div>
    </div>
  );
}
