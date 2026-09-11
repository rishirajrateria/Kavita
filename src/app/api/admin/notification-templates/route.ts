/** `PUT /api/admin/notification-templates` — upsert a (kind, recipient) override (editor+). */
import { getDb } from "@/db";
import { notificationTemplateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { upsertTemplate } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const PUT = adminRoute(
  async ({ data, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const { before, after } = await upsertTemplate(
      db,
      data,
      session.bypass ? null : session.adminUser.id,
    );
    await audit({
      action: "notification_templates.upsert",
      entityType: "notification_templates",
      entityId: after.id,
      before,
      after,
    });
    return { template: after };
  },
  { role: "editor", schema: notificationTemplateSchema },
);
