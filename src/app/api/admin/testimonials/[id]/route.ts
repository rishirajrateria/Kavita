/**
 * `PATCH /api/admin/testimonials/[id]` — edit / publish / unpublish (editor+; publishing needs
 * consent and refuses placeholders → 409). `DELETE` — owner only.
 */
import { getDb } from "@/db";
import { deleteTestimonial, updateTestimonial } from "@/lib/admin/content";
import { testimonialUpdateSchema } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute(
  async ({ data, params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const result = await updateTestimonial(db, id, data);
    if (!result.ok) {
      if (result.reason === "not_found") throw new AdminRouteError("not_found");
      throw new AdminRouteError(
        "conflict",
        result.reason === "consent_required"
          ? "Consent must be recorded before publishing"
          : "Placeholder testimonials can never be published",
        { reason_detail: result.reason },
      );
    }
    await audit({
      action: "testimonials.update",
      entityType: "testimonials",
      entityId: id,
      before: result.before,
      after: result.after,
    });
    return { testimonial: result.after };
  },
  { role: "editor", schema: testimonialUpdateSchema },
);

export const DELETE = adminRoute(
  async ({ params, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const id = String(params.id ?? "");
    const before = await deleteTestimonial(db, id);
    if (!before) throw new AdminRouteError("not_found");
    await audit({
      action: "testimonials.delete",
      entityType: "testimonials",
      entityId: id,
      before,
    });
    return {};
  },
  { role: "owner" },
);
