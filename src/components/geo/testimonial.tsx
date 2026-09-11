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
 */
export function GeoTestimonial({
  testimonial,
  question,
}: {
  testimonial: Testimonial;
  question: Question;
}) {
  const t = testimonial;
  return (
    <Section spacing="lg" tone="muted" bordered>
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={question} layout="split" />
        <figure className="relative mx-auto max-w-[52rem] overflow-hidden rounded-xl border bg-background p-8 pt-16 shadow-xs sm:p-10 sm:pt-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-7 font-serif text-[5rem] leading-none text-accent-strong/25 select-none"
          >
            &ldquo;
          </span>
          {t.rating != null ? <Rating value={t.rating} size="sm" /> : null}
          <blockquote className="mt-4 font-serif text-xl leading-relaxed sm:text-2xl">
            <p>{t.quote}</p>
          </blockquote>
          <figcaption className="mt-6 border-t border-accent-border/30 pt-4 text-sm text-muted-foreground">
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
