import { FigureSection, Tablets } from "@/components/content";
import type { Testimonial } from "@/lib/data/types";
import type { Question } from "./answers";
import type { Plate } from "./parts";

/**
 * One real, consented client experience from this place (CLAUDE.md §12) as a single glass
 * tablet. The page renders this block only when the record's `testimonialId` resolves to a
 * published, consented, non-placeholder row; otherwise the block is omitted entirely. No
 * Review/AggregateRating schema is ever emitted from here.
 */
export function GeoTestimonial({
  testimonial,
  placeName,
  question,
  route,
  plate,
}: {
  testimonial: Testimonial;
  placeName: string;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  plate: Plate;
}) {
  return (
    <FigureSection
      id="client-experience"
      route={route}
      n={plate.n}
      tone={plate.tone}
      question={question.question}
      answer={question.answer}
    >
      <Tablets items={[{ testimonial, placeName }]} className="md:grid-cols-1 lg:grid-cols-1" />
    </FigureSection>
  );
}
