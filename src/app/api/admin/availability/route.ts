/** `PUT /api/admin/availability` — replace the weekly rule grid (editor+). */
import { getDb } from "@/db";
import { availabilityWeekSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { replaceWeeklyRules } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const PUT = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const { before, after } = await replaceWeeklyRules(db, data.rules);
    const brief = (rows: typeof after) =>
      rows.map((r) => `${r.weekday}:${r.startTime}-${r.endTime}`).sort();
    await audit({
      action: "availability_rules.replace",
      entityType: "availability_rules",
      before: brief(before),
      after: brief(after),
    });
    return { rules: after };
  },
  { role: "editor", schema: availabilityWeekSchema },
);
