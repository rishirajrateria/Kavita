/** `POST /api/admin/aeo/llms` — save the llms.txt / llms-full.txt composition (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { llmsDocumentSchema } from "@/lib/seo/admin-schemas";
import { saveSiteDocument, type LlmsDocumentConfig } from "@/lib/seo/documents";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const config: LlmsDocumentConfig = {
      ...(data.preamble ? { preamble: data.preamble } : {}),
      excludePaths: data.excludePaths,
      extraPaths: data.extraPaths,
      order: data.order,
      includeCountryGeo: data.includeCountryGeo,
    };
    const { before, after } = await saveSiteDocument(
      db,
      "llms",
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
  { role: "editor", schema: llmsDocumentSchema },
);
