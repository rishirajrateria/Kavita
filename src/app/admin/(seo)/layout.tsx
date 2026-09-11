import { AdminShell } from "@/components/admin/shell/admin-shell";

export const dynamic = "force-dynamic";

/** SEO control routes (seo, faqs, aeo, social, redirects, sitemaps, indexing, integrations, health) share the guarded admin chrome. */
export default function SeoLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
