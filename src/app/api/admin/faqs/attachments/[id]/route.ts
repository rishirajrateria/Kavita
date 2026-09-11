/** `PATCH /api/admin/faqs/attachments/[id]` (order/publish/pattern); `DELETE` detaches. */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { attachmentUpdateSchema } from "@/lib/seo/admin-schemas";
import { deleteAttachment, updateAttachment } from "@/lib/seo/faq-attach";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const { before, after } = await updateAttachment(db, id, data);
    if (!before) throw new AdminRouteError("not_found");
    await audit({
      action: "faq_attachments.update",
      entityType: "faq_attachments",
      entityId: id,
      before,
      after,
    });
    return { row: after };
  },
  { role: "editor", schema: attachmentUpdateSchema },
);

export const DELETE = adminRoute(async ({ params, audit }) => {
  const db = getDb();
  if (!db) throw new AdminRouteError("not_connected");
  const id = String(params.id ?? "");
  const before = await deleteAttachment(db, id);
  if (!before) throw new AdminRouteError("not_found");
  await audit({
    action: "faq_attachments.delete",
    entityType: "faq_attachments",
    entityId: id,
    before,
  });
  return {};
});
