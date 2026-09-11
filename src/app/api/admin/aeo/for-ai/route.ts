/** `POST /api/admin/aeo/for-ai` — save the /for-ai additions (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { forAiDocumentSchema } from "@/lib/seo/admin-schemas";
import { saveSiteDocument, type ForAiDocumentConfig } from "@/lib/seo/documents";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const config: ForAiDocumentConfig = {
      ...(data.intro ? { intro: data.intro } : {}),
      extraFacts: data.extraFacts ?? [],
      extraLimits: data.extraLimits,
      extraBring: data.extraBring,
    };
    const { before, after } = await saveSiteDocument(
      db,
      "for_ai",
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
  { role: "editor", schema: forAiDocumentSchema },
);
