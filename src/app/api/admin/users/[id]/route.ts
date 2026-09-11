/** `PATCH /api/admin/users/[id]` — role / active / name (owner only; the last owner is protected). */
import { getDb } from "@/db";
import { adminUserUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { updateAdminUser, wouldRemoveLastOwner } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    if (id === session.adminUser.id && data.isActive === false)
      throw new AdminRouteError("conflict", "You cannot deactivate yourself");
    if (await wouldRemoveLastOwner(db, id, data))
      throw new AdminRouteError("conflict", "At least one active owner must remain");
    const { before, after } = await updateAdminUser(db, id, data);
    if (!before || !after) throw new AdminRouteError("not_found");
    const brief = (u: typeof after) => ({
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      displayName: u.displayName,
    });
    await audit({
      action: "admin_users.update",
      entityType: "admin_users",
      entityId: id,
      before: brief(before),
      after: brief(after),
    });
    return { user: brief(after) };
  },
  { role: "owner", schema: adminUserUpdateSchema },
);
