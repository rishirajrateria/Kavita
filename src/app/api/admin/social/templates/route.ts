/** `POST /api/admin/social/templates` — default OG/Twitter templates per content type (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { ogTemplatesSchema } from "@/lib/seo/admin-schemas";
import { OG_TEMPLATE_TYPES, saveSiteDocument, type OgTemplates } from "@/lib/seo/documents";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const config: OgTemplates = {};
    for (const type of OG_TEMPLATE_TYPES) {
      const title = data[`${type}_title`];
      const description = data[`${type}_description`];
      const image = data[`${type}_image`];
      if (title || description || image) {
        config[type] = {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(image ? { image } : {}),
        };
      }
    }
    const { before, after } = await saveSiteDocument(
      db,
      "og_templates",
      config as Record<string, unknown>,
      session.bypass ? null : session.adminUser.id,
    );
    await audit({
      action: "site_documents.save",
      entityType: "site_documents",
      entityId: after?.id ?? null,
      before,
      after,
    });
    return { row: after };
  },
  { role: "editor", schema: ogTemplatesSchema },
);
