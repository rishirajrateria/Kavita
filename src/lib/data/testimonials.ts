/**
 * Testimonials. With a database: only real rows that are published, consented and not
 * placeholders — possibly none, in which case components omit the block entirely (§12).
 * Without a database: the clearly-marked placeholders, so components can be built; the build
 * gate refuses to ship them.
 */
import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { testimonials } from "@/db/schema";
import { PLACEHOLDER_TESTIMONIALS } from "@/content/PLACEHOLDERS";
import type { Testimonial } from "./types";

export const getPublishedTestimonials = cache(async (): Promise<Testimonial[]> => {
  const db = getDb();
  if (db) {
    return db.query.testimonials.findMany({
      where: and(
        eq(testimonials.isPublished, true),
        eq(testimonials.consentGiven, true),
        eq(testimonials.isPlaceholder, false),
      ),
      orderBy: [desc(testimonials.date), desc(testimonials.createdAt)],
    });
  }
  return [...PLACEHOLDER_TESTIMONIALS];
});
