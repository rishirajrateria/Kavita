/** `PATCH` / `DELETE /api/admin/redirects/[id]` (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { afterRedirectWrite } from "@/lib/redirects/refresh";
import {
  deleteRedirect,
  redirectInputSchema,
  RedirectSaveError,
  updateRedirect,
} from "@/lib/redirects/store";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, request, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    try {
      const { redirect, before, check } = await updateRedirect(db, id, data);
      await audit({
        action: "redirects.update",
        entityType: "redirects",
        entityId: id,
        before,
        after: redirect,
      });
      afterRedirectWrite(request);
      return { redirect, chain: check.chain, collapsedTo: check.finalDestination };
    } catch (error) {
      if (error instanceof RedirectSaveError) {
        if (error.reason === "not_found") throw new AdminRouteError("not_found");
        throw new AdminRouteError(
          error.reason === "duplicate" ? "conflict" : "validation",
          error.message,
          {
            errors: { fromPath: [error.message] },
          },
        );
      }
      throw error;
    }
  },
  { role: "editor", schema: redirectInputSchema },
);

export const DELETE = adminRoute(
  async ({ params, request, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const before = await deleteRedirect(db, id);
    if (!before) throw new AdminRouteError("not_found");
    await audit({ action: "redirects.delete", entityType: "redirects", entityId: id, before });
    afterRedirectWrite(request);
    return { deleted: id };
  },
  { role: "editor" },
);
