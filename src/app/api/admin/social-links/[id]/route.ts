/** `PATCH` / `DELETE /api/admin/social-links/[id]` (editor+). */
import { getDb } from "@/db";
import { socialLinkUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { deleteSocialLink, updateSocialLink } from "@/lib/admin/social";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const result = await updateSocialLink(db, id, data);
    if (!result.ok) {
      if (result.reason === "not_found") throw new AdminRouteError("not_found");
      throw new AdminRouteError("conflict", "That URL is already listed");
    }
    await audit({
      action: "social_links.update",
      entityType: "social_links",
      entityId: id,
      before: result.before,
      after: result.after,
    });
    return { link: result.after };
  },
  { role: "editor", schema: socialLinkUpdateSchema },
);

export const DELETE = adminRoute(
  async ({ params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const before = await deleteSocialLink(db, id);
    if (!before) throw new AdminRouteError("not_found");
    await audit({
      action: "social_links.delete",
      entityType: "social_links",
      entityId: id,
      before,
    });
    return {};
  },
  { role: "editor" },
);
