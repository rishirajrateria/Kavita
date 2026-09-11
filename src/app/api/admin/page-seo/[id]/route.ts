/** `PATCH /api/admin/page-seo/[id]` update; `DELETE` removes the override (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { pageSeoSchema } from "@/lib/seo/admin-schemas";
import { deletePageSeo, savePageSeo } from "@/lib/seo/page-seo-admin";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const { before, after, warnings } = await savePageSeo(db, data, id);
    if (!before) throw new AdminRouteError("not_found");
    await audit({ action: "page_seo.update", entityType: "page_seo", entityId: id, before, after });
    return { row: after, warnings };
  },
  { role: "editor", schema: pageSeoSchema },
);

export const DELETE = adminRoute(async ({ params, audit }) => {
  const db = getDb();
  if (!db) throw new AdminRouteError("not_connected");
  const id = String(params.id ?? "");
  const before = await deletePageSeo(db, id);
  if (!before) throw new AdminRouteError("not_found");
  await audit({ action: "page_seo.delete", entityType: "page_seo", entityId: id, before });
  return {};
});
