/** `POST /api/admin/social-links` — add a link after per-platform validation (editor+). */
import { getDb } from "@/db";
import { socialLinkSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { createSocialLink } from "@/lib/admin/social";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const result = await createSocialLink(db, data);
    if (!result.ok) throw new AdminRouteError("conflict", "That URL is already listed");
    await audit({
      action: "social_links.create",
      entityType: "social_links",
      entityId: result.link.id,
      after: result.link,
    });
    return { link: result.link };
  },
  { role: "editor", schema: socialLinkSchema },
);
