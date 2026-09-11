/** `POST /api/admin/redirects/import` — body `{ csv }`; upserts by source (editor+). */
import { z } from "zod";
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { parseRedirectsCsv } from "@/lib/redirects/csv";
import { afterRedirectWrite } from "@/lib/redirects/refresh";
import { importRedirects } from "@/lib/redirects/store";

export const dynamic = "force-dynamic";

const schema = z.object({ csv: z.string().min(1).max(2_000_000) });

export const POST = adminRoute(
  async ({ data, request, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const parsed = parseRedirectsCsv(data.csv);
    if (parsed.rows.length === 0 && parsed.errors.length === 0) {
      throw new AdminRouteError("validation", "The CSV has no rows", {
        errors: { csv: ["no rows found"] },
      });
    }
    const result = await importRedirects(db, parsed.rows);
    await audit({
      action: "redirects.import",
      entityType: "redirects",
      after: { created: result.created, updated: result.updated, skipped: result.skipped.length },
    });
    afterRedirectWrite(request);
    return { ...result, parseErrors: parsed.errors };
  },
  { role: "editor", schema },
);
