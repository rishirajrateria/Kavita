/** `DELETE /api/admin/not-found-log/[id]` — drop a logged path (editor+). */
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { deleteNotFound } from "@/lib/redirects/not-found-log";

export const dynamic = "force-dynamic";

export const DELETE = adminRoute(
  async ({ params, audit }) => {
    const id = String(params.id ?? "");
    if (!(await deleteNotFound(id))) throw new AdminRouteError("not_found");
    await audit({ action: "not_found_log.delete", entityType: "not_found_log", entityId: id });
    return { deleted: id };
  },
  { role: "editor" },
);
