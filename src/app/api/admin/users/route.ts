/** `POST /api/admin/users` — invite an admin by email (owner only). */
import { getDb } from "@/db";
import { adminInviteSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { inviteAdminUser } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const result = await inviteAdminUser(db, data);
    if (!result.ok) {
      if (result.reason === "exists")
        throw new AdminRouteError("conflict", "That email is already an admin");
      if (result.reason === "auth_not_configured")
        throw new AdminRouteError(
          "not_connected",
          "Supabase service role key is required to send invitations",
        );
      throw new AdminRouteError("server_error", "The invitation could not be sent");
    }
    await audit({
      action: "admin_users.invite",
      entityType: "admin_users",
      entityId: result.user.id,
      after: { email: result.user.email, role: result.user.role },
    });
    return { user: { id: result.user.id, email: result.user.email, role: result.user.role } };
  },
  { role: "owner", schema: adminInviteSchema },
);
