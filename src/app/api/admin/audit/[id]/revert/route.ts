/**
 * `POST /api/admin/audit/[id]/revert` — re-apply the `before` snapshot of one audit entry to
 * its entity (owner only). The revert is audited as `<entity>.revert`; see
 * `src/lib/admin/revert.ts` for which entity types and snapshots qualify.
 */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { revertAuditEntry } from "@/lib/admin/revert";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ params, session, request }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const result = await revertAuditEntry(db, id, {
      adminUserId: session.adminUser.id,
      request,
    });
    if (!result.ok) {
      const reason =
        result.reason === "not_found" || result.reason === "gone"
          ? "not_found"
          : result.reason === "conflict"
            ? "conflict"
            : "bad_request";
      throw new AdminRouteError(reason, result.message);
    }
    return { ...result };
  },
  { role: "owner" },
);
