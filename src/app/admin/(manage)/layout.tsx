import { AdminShell } from "@/components/admin/shell/admin-shell";

export const dynamic = "force-dynamic";

/** Management routes (bookings, content, settings, site) share the guarded admin chrome. */
export default function ManageLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
