/**
 * `Review` and `AggregateRating` JSON-LD for `/testimonials` (CLAUDE.md §8). Built ONLY from
 * real, consented, non-placeholder testimonials; the aggregate only from ratings clients gave.
 * Kept out of the shared schema file so the rule "no review markup without real reviews" is
 * enforced at the one call site that can emit it.
 */
import type { Testimonial } from "@/lib/data";
import { compact, schemaId, withContext, type Thing, type WithContext } from "@/lib/seo/schema";

export interface ReviewSource {
  testimonial: Testimonial;
  serviceName?: string;
}

/** Testimonials that may lawfully carry review markup. */
export function reviewable(testimonials: Testimonial[]): Testimonial[] {
  return testimonials.filter(
    (t) => !t.isPlaceholder && t.consentGiven && t.isPublished && !t.quote.includes("{{"),
  );
}

export interface Review extends Thing {
  "@type": "Review";
  reviewBody: string;
  author: Thing;
  itemReviewed: Thing;
  datePublished?: string;
  reviewRating?: Thing;
  about?: Thing;
}

export function reviewSchema(input: ReviewSource, siteUrl: string): WithContext<Review> | null {
  const t = input.testimonial;
  if (reviewable([t]).length === 0) return null;
  return withContext(
    compact<Review>({
      "@type": "Review",
      reviewBody: t.quote,
      author: { "@type": "Person", name: t.clientName },
      itemReviewed: { "@id": schemaId(siteUrl, "organization"), "@type": "ProfessionalService" },
      datePublished: t.date ? t.date.toISOString().slice(0, 10) : undefined,
      reviewRating:
        t.rating != null
          ? { "@type": "Rating", ratingValue: t.rating, bestRating: 5, worstRating: 1 }
          : undefined,
      about: input.serviceName ? { "@type": "Service", name: input.serviceName } : undefined,
    }),
  );
}

export interface AggregateRating extends Thing {
  "@type": "AggregateRating";
  ratingValue: number;
  ratingCount: number;
  bestRating: number;
  worstRating: number;
  itemReviewed: Thing;
}

/** Mean of the ratings real clients gave; `null` when no consented testimonial has a rating. */
export function aggregateRatingSchema(
  testimonials: Testimonial[],
  siteUrl: string,
): WithContext<AggregateRating> | null {
  const rated = reviewable(testimonials).filter((t) => t.rating != null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, t) => acc + (t.rating as number), 0);
  return withContext(
    compact<AggregateRating>({
      "@type": "AggregateRating",
      ratingValue: Math.round((sum / rated.length) * 10) / 10,
      ratingCount: rated.length,
      bestRating: 5,
      worstRating: 1,
      itemReviewed: { "@id": schemaId(siteUrl, "organization"), "@type": "ProfessionalService" },
    }),
  );
}
