/** `POST /api/admin/page-seo` — create or replace the override for a route pattern (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { submitIndexNowLogged } from "@/lib/redirects/indexnow-log";
import { pageSeoSchema } from "@/lib/seo/admin-schemas";
import { savePageSeo } from "@/lib/seo/page-seo-admin";
import { isGlobPattern } from "@/lib/seo/route-pattern";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const { before, after, warnings } = await savePageSeo(db, data);
    await audit({
      action: before ? "page_seo.update" : "page_seo.create",
      entityType: "page_seo",
      entityId: after?.id ?? null,
      before,
      after,
    });
    // Exact routes are re-submitted to IndexNow (Bing / ChatGPT search) on every save.
    if (after && !isGlobPattern(after.routePattern) && after.isActive) {
      void submitIndexNowLogged([after.routePattern], "page_seo").catch(() => undefined);
    }
    return { row: after, warnings };
  },
  { role: "editor", schema: pageSeoSchema },
);
