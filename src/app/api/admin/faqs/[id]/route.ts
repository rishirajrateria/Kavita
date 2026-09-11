/** `PATCH` / `DELETE /api/admin/faqs/[id]` (editor+). */
import { getDb } from "@/db";
import { deleteFaq, updateFaq } from "@/lib/admin/content";
import { faqUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const { before, after } = await updateFaq(db, id, data);
    if (!before || !after) throw new AdminRouteError("not_found");
    await audit({ action: "faqs.update", entityType: "faqs", entityId: id, before, after });
    return { faq: after };
  },
  { role: "editor", schema: faqUpdateSchema },
);

export const DELETE = adminRoute(
  async ({ params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const before = await deleteFaq(db, id);
    if (!before) throw new AdminRouteError("not_found");
    await audit({ action: "faqs.delete", entityType: "faqs", entityId: id, before });
    return {};
  },
  { role: "editor" },
);
