/** `PATCH /api/admin/services/[id]` — edit a service (editor+). Slug is immutable. */
import { getDb } from "@/db";
import { updateService } from "@/lib/admin/content";
import { serviceUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute, readAdminBody } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

/** `prices.INR=…` form fields → `{ prices: { INR: … } }`, empty strings dropped. */
function liftPrices(body: Record<string, unknown>): Record<string, unknown> {
  const prices: Record<string, unknown> = {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith("prices.")) {
      if (v !== "" && v !== null && v !== undefined) prices[k.slice(7)] = v;
    } else if (v !== "") out[k] = v;
  }
  if (Object.keys(prices).length || "prices" in body) out.prices = prices;
  if (body.priceMinor === "") out.priceMinor = null;
  if (body.currency === "") out.currency = null;
  return out;
}

export const PATCH = adminRoute(
  async ({ request, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const raw = await readAdminBody(request);
    if (!raw) throw new AdminRouteError("bad_request");
    const parsed = serviceUpdateSchema.safeParse(liftPrices(raw));
    if (!parsed.success)
      throw new AdminRouteError("validation", "Check the fields", {
        errors: parsed.error.flatten().fieldErrors,
      });
    const id = String(params.id ?? "");
    const { before, after } = await updateService(db, id, parsed.data);
    if (!before || !after) throw new AdminRouteError("not_found");
    await audit({ action: "services.update", entityType: "services", entityId: id, before, after });
    return { service: after };
  },
  { role: "editor" },
);
