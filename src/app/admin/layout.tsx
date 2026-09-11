/**
 * Root of the admin panel. Every admin page is dynamic and `noindex` (robots.txt already
 * disallows `/admin`). The chrome itself (`AdminShell`) is rendered by the route-group layouts
 * — `(analytics)` here, `(manage)` for P5-C — so `/admin/login` can stay chrome-free.
 *
 * The public site layout (`src/app/layout.tsx`) still wraps this tree; its header, footer, CTA
 * bar and skip link are hidden here with a scoped stylesheet rather than by splitting the app
 * into two root layouts, which would move every public route while other phase work touches the
 * root layout. Revisit as a `(site)` / `(admin)` route-group split once Phase 5 lands.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const HIDE_SITE_CHROME = `
body > header, body > footer, body > .skip-link,
body > div[role="region"][aria-label="Quick actions"] { display: none !important; }
main#main { display: contents; }
`;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HIDE_SITE_CHROME }} />
      {children}
    </>
  );
}
