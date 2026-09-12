import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Rating } from "@/components/ui/rating";
import { Section } from "@/components/ui/section";
import type { Testimonial } from "@/lib/data/types";
import type { Question } from "./answers";

/**
 * One real, consented client experience from this place (CLAUDE.md §12). The page renders this
 * block only when the record's `testimonialId` resolves to a published, consented,
 * non-placeholder row; otherwise the block is omitted entirely. No Review/AggregateRating
 * schema is ever emitted from here.
 *
 * A pull quote, not a card: an oversized gold quotation mark, a gold rule down the side and
 * nothing else, so a real voice reads as speech on the page rather than as another panel.
 */
export function GeoTestimonial({
  testimonial,
  question,
  route,
}: {
  testimonial: Testimonial;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
}) {
  const t = testimonial;
  return (
    <Section id="client-experience" spacing="lg" tone="muted">
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={question} route={route} id="client-experience" layout="split" />
        <figure className="relative mx-auto max-w-[52rem] border-l-2 border-accent-border/60 pt-10 pl-7 sm:pl-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-5 font-serif text-[6rem] leading-none text-accent-strong/25 select-none sm:left-8"
          >
            &ldquo;
          </span>
          {t.rating != null ? <Rating value={t.rating} size="sm" /> : null}
          <blockquote className="mt-4 font-serif text-2xl leading-relaxed sm:text-3xl">
            <p>{t.quote}</p>
          </blockquote>
          <figcaption className="mt-8 border-t border-accent-border/30 pt-4 text-sm text-muted-foreground">
            <span className="font-sans text-base text-foreground">{t.clientName}</span>
            {t.date ? (
              <>
                {" · "}
                <time dateTime={t.date.toISOString().slice(0, 10)}>
                  {t.date.toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
                </time>
              </>
            ) : null}
          </figcaption>
        </figure>
      </Container>
    </Section>
  );
}
