/** `POST /api/admin/social-links/reorder` — `{ ids }` in display order (editor+). */
import { getDb } from "@/db";
import { socialReorderSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { reorderSocialLinks } from "@/lib/admin/social";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const { before, after } = await reorderSocialLinks(db, data.ids);
    const order = (rows: typeof after) =>
      [...rows].sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.platform);
    await audit({
      action: "social_links.reorder",
      entityType: "social_links",
      before: order(before),
      after: order(after),
    });
    return { links: after };
  },
  { role: "editor", schema: socialReorderSchema },
);
