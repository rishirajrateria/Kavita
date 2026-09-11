/** `POST /api/admin/availability/exceptions` — block or open whole days (editor+). */
import { getDb } from "@/db";
import { addDays, localMidnight } from "@/lib/admin/calendar";
import { availabilityExceptionFormSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { addException } from "@/lib/admin/settings";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const { timezone } = await getSiteSettings();
    const row = await addException(db, {
      startsAt: localMidnight(data.fromDate, timezone),
      endsAt: localMidnight(addDays(data.toDate, 1), timezone),
      isBlocked: data.isBlocked,
      reason: data.reason,
    });
    await audit({
      action: "availability_exceptions.create",
      entityType: "availability_exceptions",
      entityId: row.id,
      after: row,
    });
    return { exception: row };
  },
  { role: "editor", schema: availabilityExceptionFormSchema },
);
