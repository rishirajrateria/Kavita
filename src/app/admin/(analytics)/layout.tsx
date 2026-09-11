import { AdminShell } from "@/components/admin/shell/admin-shell";

export const dynamic = "force-dynamic";

/** Analytics routes share the guarded admin chrome; `AdminShell` handles auth + "Not connected". */
export default function AnalyticsLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
