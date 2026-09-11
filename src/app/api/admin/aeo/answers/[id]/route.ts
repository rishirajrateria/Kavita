/** `DELETE /api/admin/aeo/answers/[id]` — remove an override; the page's own copy returns. */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { deletePageAnswer } from "@/lib/seo/aeo-data";

export const dynamic = "force-dynamic";

export const DELETE = adminRoute(async ({ params, audit }) => {
  const db = getDb();
  if (!db) throw new AdminRouteError("not_connected");
  const id = String(params.id ?? "");
  const before = await deletePageAnswer(db, id);
  if (!before) throw new AdminRouteError("not_found");
  await audit({ action: "page_answers.delete", entityType: "page_answers", entityId: id, before });
  return {};
});
