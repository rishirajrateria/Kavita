/** `DELETE /api/admin/og-library/[id]` — remove an image from the library (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { deleteOgImage } from "@/lib/seo/og-library";

export const dynamic = "force-dynamic";

export const DELETE = adminRoute(async ({ params, audit }) => {
  const db = getDb();
  if (!db) throw new AdminRouteError("not_connected");
  const id = String(params.id ?? "");
  const before = await deleteOgImage(db, id);
  if (!before) throw new AdminRouteError("not_found");
  await audit({ action: "og_images.delete", entityType: "og_images", entityId: id, before });
  return {};
});
