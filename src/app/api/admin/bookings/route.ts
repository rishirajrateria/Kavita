/**
 * `GET /api/admin/bookings` — the filtered list as JSON, or `?format=csv` / `?format=ics` as a
 * download of every matching booking (paging ignored, capped at 2,000 rows). Read-only, so
 * viewers may call it; exports carry contact details but never birth details or notes.
 */
import { getDb } from "@/db";
import { listBookings } from "@/lib/admin/bookings";
import { bookingsToCsv, bookingsToIcs } from "@/lib/admin/exports";
import { bookingListQuerySchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = adminRoute(
  async ({ searchParams, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const parsed = bookingListQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) throw new AdminRouteError("validation", "Bad filters");
    const settings = await getSiteSettings();
    const format = searchParams.get("format");
    if (format === "csv" || format === "ics") {
      // Pull every page of the current filter (bounded) for the export.
      const rows = [];
      for (let page = 1; page <= 80; page += 1) {
        const chunk = await listBookings(db, { ...parsed.data, page }, settings);
        rows.push(...chunk.rows);
        if (page >= chunk.pageCount) break;
      }
      await audit({
        action: `bookings.export_${format}`,
        entityType: "bookings",
        after: { rows: rows.length, filters: parsed.data },
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const body = format === "csv" ? bookingsToCsv(rows, settings) : bookingsToIcs(rows, settings);
      return new Response(body, {
        status: 200,
        headers: {
          "content-type":
            format === "csv" ? "text/csv; charset=utf-8" : "text/calendar; charset=utf-8",
          "content-disposition": `attachment; filename="bookings-${stamp}.${format}"`,
          "cache-control": "no-store",
        },
      });
    }
    const list = await listBookings(db, parsed.data, settings);
    return { ...list };
  },
  { role: "viewer" },
);
