/**
 * Admin chrome: indigo sidebar (inverse tone), ivory content area, header with the admin's name,
 * role chip, theme toggle and sign-out. Server component; the sidebar's current-item marking and
 * the phone drawer are the only client islands. Calls `requireAdmin()` itself, so any layout
 * that renders `<AdminShell>` is protected — P5-C's `(manage)` layout uses it as-is.
 */
import Link from "next/link";
import { VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSiteSettings } from "@/lib/data";
import { getAdminAuthMode, requireAdmin, roleLabel, type AdminSession } from "@/lib/admin/auth";
import { AdminNavLinks } from "./nav-links";
import { MobileAdminNav } from "./mobile-admin-nav";
import { NotConnected } from "./not-connected";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (getAdminAuthMode() === "not_connected") return <NotConnected />;
  const [session, settings] = await Promise.all([requireAdmin(), getSiteSettings()]);
  return (
    <AdminFrame session={session} brand={settings.brandName}>
      {children}
    </AdminFrame>
  );
}

/** The chrome without the guard — used by the shell above and by the design preview route. */
export function AdminFrame({
  session,
  brand,
  children,
}: {
  session: AdminSession;
  brand: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root flex min-h-dvh bg-background text-foreground">
      <aside
        data-tone="inverse"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-background text-foreground md:flex"
      >
        <Link
          href="/admin"
          className="flex h-16 items-center gap-2.5 border-b border-border px-5 no-underline"
        >
          <VastuCompass
            decorative
            hideLabels
            strokeWidth={1.1}
            className="size-6 text-accent-strong"
          />
          <span className="truncate font-serif text-base font-medium tracking-tight">{brand}</span>
          <span className="ml-auto rounded-full border border-accent-border/60 px-1.5 text-[0.6rem] font-semibold tracking-[0.12em] text-accent-foreground uppercase">
            Admin
          </span>
        </Link>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
          <AdminNavLinks />
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground no-underline hover:text-foreground"
          >
            ← View site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur md:px-8">
          <MobileAdminNav brand={brand} />
          <span className="font-serif text-lg md:hidden">{brand}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 text-sm sm:flex">
              <span className="font-medium">{session.adminUser.displayName}</span>
              <span className="rounded-full border border-accent-border/60 bg-accent px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide text-accent-foreground uppercase">
                {roleLabel(session.adminUser.role)}
              </span>
              {session.bypass ? (
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide text-warning uppercase">
                  Dev bypass
                </span>
              ) : null}
            </span>
            <ThemeToggle />
            <form action="/api/admin/auth/logout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none md:px-8 md:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
