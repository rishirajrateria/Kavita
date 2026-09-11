/**
 * `PATCH /api/admin/site-settings` — edit the single settings row (editor+). Form posts carry
 * hours as `hours.<day>.open` / `.close`; both empty = closed that day.
 */
import { WEEKDAYS, type BusinessHours } from "@/db/schema";
import { getDb } from "@/db";
import { siteSettingsUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute, readAdminBody } from "@/lib/admin/mutations";
import { updateSiteSettings } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

function liftHours(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let sawHours = false;
  const hours: Partial<BusinessHours> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith("hours.")) {
      sawHours = true;
      continue;
    }
    if (v !== "") out[k] = v;
  }
  if (sawHours) {
    for (const d of WEEKDAYS) {
      const open = String(body[`hours.${d}.open`] ?? "");
      const close = String(body[`hours.${d}.close`] ?? "");
      hours[d] = open && close ? [{ open, close }] : null;
    }
    out.businessHours = hours;
  }
  return out;
}

export const PATCH = adminRoute(
  async ({ request, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const raw = await readAdminBody(request);
    if (!raw) throw new AdminRouteError("bad_request");
    const parsed = siteSettingsUpdateSchema.safeParse(liftHours(raw));
    if (!parsed.success)
      throw new AdminRouteError("validation", "Check the fields", {
        errors: parsed.error.flatten().fieldErrors,
      });
    const { before, after } = await updateSiteSettings(db, parsed.data);
    if (!before || !after)
      throw new AdminRouteError("not_found", "site_settings has no row yet — run pnpm db:seed");
    await audit({
      action: "site_settings.update",
      entityType: "site_settings",
      entityId: after.id,
      before,
      after,
    });
    return { settings: after };
  },
  { role: "editor" },
);
