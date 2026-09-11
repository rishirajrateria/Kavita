/** `POST /api/admin/faqs/bulk-attach` — attach many FAQs to one route pattern (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { bulkAttachSchema } from "@/lib/seo/admin-schemas";
import { bulkAttach } from "@/lib/seo/faq-attach";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const rows = await bulkAttach(db, data);
    await audit({
      action: "faq_attachments.bulk_attach",
      entityType: "faq_attachments",
      after: { routePattern: data.routePattern, count: rows.length, ids: rows.map((r) => r.id) },
    });
    return { attached: rows.length, rows };
  },
  { role: "editor", schema: bulkAttachSchema },
);
