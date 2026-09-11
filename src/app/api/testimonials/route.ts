/**
 * `POST /api/testimonials` — the client-experience intake form. Writes an unpublished
 * `testimonials` row (`is_published = false`, `consent_given` as ticked, `source =
 * "website_form"`, never a placeholder) and the submitter's private details into
 * `testimonial_submissions`, in one transaction. Publishing is an admin decision (§12).
 */
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { testimonialSubmissions, testimonials } from "@/db/schema";
import { getServiceBySlug } from "@/lib/data/services";
import { track } from "@/lib/events";
import { handleFormPost } from "@/lib/validation/form-request";
import { testimonialSchema } from "@/lib/validation/testimonial";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleFormPost(request, {
    schema: testimonialSchema,
    redirectPath: "/share-your-experience",
    persist: async (data, ctx) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");
      const service = data.serviceSlug ? await getServiceBySlug(data.serviceSlug) : null;
      await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(testimonials)
          .values({
            clientName: data.name,
            serviceId: service?.id ?? null,
            quote: data.experience,
            rating: data.rating ?? null,
            date: new Date(),
            source: "website_form",
            consentGiven: data.consent,
            isPublished: false,
            isPlaceholder: false,
          })
          .returning({ id: testimonials.id });
        if (!row) throw new Error("Insert returned no row");
        await tx.insert(testimonialSubmissions).values({
          testimonialId: row.id,
          email: data.email,
          locationText: data.location,
          region: ctx.region,
        });
      });
    },
    onSuccess: (data) =>
      track("testimonial_submitted", {
        source: "website_form",
        consentGiven: data.consent,
        hasRating: data.rating !== undefined,
      }),
  });
}
