/**
 * `PATCH /api/admin/locations/<country>/<state>/<city>` — save research / featured / content
 * date for a database-backed location (editor+). Status is re-derived server-side; the audit
 * row stores the derived status and word counts, not the full prose twice.
 */
import { getDb } from "@/db";
import { updateLocation } from "@/lib/admin/content";
import { locationUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

const PATH = /^[a-z0-9-]+(\/[a-z0-9-]+){0,2}$/;

export const PATCH = adminRoute(
  async ({ data, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const segments = Array.isArray(params.path) ? params.path : [params.path ?? ""];
    const path = segments.join("/");
    if (!PATH.test(path)) throw new AdminRouteError("not_found");
    const { before, after } = await updateLocation(db, path, data);
    if (!before || !after)
      throw new AdminRouteError(
        "not_found",
        "Location is not in the database yet (run pnpm db:seed)",
      );
    const summary = (row: typeof after) => ({
      path: row.path,
      researchStatus: row.researchStatus,
      isFeatured: row.isFeatured,
      contentUpdatedAt: row.contentUpdatedAt,
      faqs: row.research?.faqs.length ?? 0,
      clientConcerns: row.research?.clientConcerns.length ?? 0,
    });
    await audit({
      action: "locations.update",
      entityType: "locations",
      entityId: after.id,
      before: summary(before),
      after: summary(after),
    });
    return { location: summary(after) };
  },
  { role: "editor", schema: locationUpdateSchema },
);
