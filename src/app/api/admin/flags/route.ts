/** `PUT /api/admin/flags` — set one feature flag (owner only). */
import { getDb } from "@/db";
import { featureFlagSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { setFlag } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const PUT = adminRoute(
  async ({ data, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const { before, after } = await setFlag(db, data, session.bypass ? null : session.adminUser.id);
    await audit({
      action: "feature_flags.set",
      entityType: "feature_flags",
      entityId: data.key,
      before: before ? { value: before.value } : null,
      after: { value: after.value },
    });
    return { flag: { key: after.key, value: after.value } };
  },
  { role: "owner", schema: featureFlagSchema },
);
