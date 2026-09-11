/** `GET /api/admin/redirects/export` — every rule as CSV (viewer+). */
import { getDb } from "@/db";
import { adminRoute } from "@/lib/admin/mutations";
import { toCsv } from "@/lib/redirects/csv";
import { listRedirects, toCsvRows } from "@/lib/redirects/store";

export const dynamic = "force-dynamic";

export const GET = adminRoute(
  async () => {
    const db = getDb();
    const rows = db ? await listRedirects(db) : [];
    return new Response(toCsv(toCsvRows(rows)), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="redirects-${new Date().toISOString().slice(0, 10)}.csv"`,
        "cache-control": "no-store",
      },
    });
  },
  { role: "viewer", requireDatabase: false },
);
