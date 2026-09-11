/** `POST /api/admin/bookings/[id]/notes` — add an internal note. Editor or owner. */
import { getDb } from "@/db";
import { addBookingNote } from "@/lib/admin/bookings";
import { bookingNoteSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, params, session, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AdminRouteError("not_found");
    const note = await addBookingNote(
      db,
      id,
      session.bypass ? null : session.adminUser.id,
      data.body,
    );
    // The note body is personal-adjacent; the audit row records that a note was added, not its text.
    await audit({
      action: "booking_notes.create",
      entityType: "booking_notes",
      entityId: note.id,
      after: { bookingId: id, length: data.body.length },
    });
    return { note: { id: note.id, createdAt: note.createdAt.toISOString() } };
  },
  { role: "editor", schema: bookingNoteSchema },
);
