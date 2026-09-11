/**
 * Website form submissions (Phase 3). Both tables hold personal data and are admin-only under
 * RLS: no public select or insert policy exists on purpose. The only write path is the
 * validated, rate-limited route handler, which uses the service role. Never log row contents.
 */
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { adminAll } from "./_policies";
import { id, timestamps } from "./_shared";
import { testimonials } from "./content";

// ---------------------------------------------------------------------------------------------
// contact_messages — `POST /api/contact`.
// ---------------------------------------------------------------------------------------------

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    /** With country code, e.g. `+91 9876543210`; null when not given. */
    phone: text("phone"),
    message: text("message").notNull(),
    /** Path of the page the form was submitted from — never a query string. */
    sourcePath: text("source_path"),
    /** ISO 3166-1 alpha-2 from the edge geo header when available. */
    region: text("region"),
    /** Set by an admin once the enquiry has been answered. */
    isHandled: boolean("is_handled").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    /** Personal data: admin-only. The route handler writes with the service role. */
    adminAll("contact_messages"),
    index("contact_messages_handled_idx").on(t.isHandled, t.createdAt),
  ],
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

// ---------------------------------------------------------------------------------------------
// testimonial_submissions — the private half of a `/share-your-experience` submission.
// The publishable text lives in `testimonials` (public-readable once published); the
// submitter's email and free-text location stay here, admin-only, so they can never leak
// through the public select policy on `testimonials`.
// ---------------------------------------------------------------------------------------------

export const testimonialSubmissions = pgTable(
  "testimonial_submissions",
  {
    id: id(),
    testimonialId: uuid("testimonial_id")
      .notNull()
      .references(() => testimonials.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    /** As typed by the client, e.g. "Pune, India"; an admin maps it to `client_location_id`. */
    locationText: text("location_text").notNull(),
    region: text("region"),
    ...timestamps,
  },
  (t) => [
    /** Personal data: admin-only. */
    adminAll("testimonial_submissions"),
    index("testimonial_submissions_testimonial_idx").on(t.testimonialId),
  ],
);

export type TestimonialSubmission = typeof testimonialSubmissions.$inferSelect;
export type NewTestimonialSubmission = typeof testimonialSubmissions.$inferInsert;
