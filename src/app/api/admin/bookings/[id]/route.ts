/**
 * `POST /api/admin/bookings/[id]` — one of confirm / reschedule / cancel / complete / no_show.
 * Editor or owner only. Audited with the booking's before/after (status, times; no client data).
 */
import { getDb } from "@/db";
import { applyBookingAction } from "@/lib/admin/bookings";
import { bookingActionSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export const POST = adminRoute(
  async ({ data, params, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    if (!UUID.test(id)) throw new AdminRouteError("not_found");
    const result = await applyBookingAction(db, id, data, {
      adminUserId: session.bypass ? null : session.adminUser.id,
    });
    if (!result.ok) {
      if (result.reason === "not_found") throw new AdminRouteError("not_found");
      if (result.reason === "invalid_transition") {
        throw new AdminRouteError(
          "conflict",
          `Cannot ${data.action} a booking that is ${result.from.replace(/_/g, " ")}`,
          { from: result.from },
        );
      }
      throw new AdminRouteError(
        "conflict",
        result.reason === "slot_taken" ? "That slot was just taken" : "That slot is not free",
        {
          alternatives: result.alternatives,
        },
      );
    }
    const snapshot = (b: typeof result.after) => ({
      id: b.id,
      status: b.status,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      rescheduledFromId: b.rescheduledFromId,
    });
    await audit({
      action: `bookings.${data.action}`,
      entityType: "bookings",
      entityId: result.after.id,
      before: snapshot(result.before),
      after: {
        ...snapshot(result.after),
        ...(data.action === "cancel" ? { reason: data.reason } : {}),
      },
    });
    return { booking: snapshot(result.after) };
  },
  { role: "editor", schema: bookingActionSchema },
);
