/** `DELETE /api/admin/availability/exceptions/[id]` (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { deleteException } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const DELETE = adminRoute(
  async ({ params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const before = await deleteException(db, id);
    if (!before) throw new AdminRouteError("not_found");
    await audit({
      action: "availability_exceptions.delete",
      entityType: "availability_exceptions",
      entityId: id,
      before,
    });
    return {};
  },
  { role: "editor" },
);
