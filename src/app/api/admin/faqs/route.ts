/** `POST /api/admin/faqs` — create a FAQ (editor+). */
import { getDb } from "@/db";
import { createFaq } from "@/lib/admin/content";
import { faqSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const faq = await createFaq(db, data);
    await audit({ action: "faqs.create", entityType: "faqs", entityId: faq.id, after: faq });
    return { faq };
  },
  { role: "editor", schema: faqSchema },
);
