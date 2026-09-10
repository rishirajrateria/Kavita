import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Container } from "@/components/ui/container";
import { Rating } from "@/components/ui/rating";
import { Section } from "@/components/ui/section";
import { TESTIMONIALS_STRIP } from "@/content/home";
import type { Testimonial } from "@/lib/data";
import { QuestionHeading } from "./question-heading";

/**
 * Client experiences (CLAUDE.md §12). No Review / AggregateRating schema is emitted from here,
 * ever; stars appear only when a client actually gave a rating. When the data layer returns
 * placeholders (no database yet) they are shown with a visible warning; when it returns nothing,
 * the whole block is omitted rather than filled.
 */
export function TestimonialsStrip({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  const hasPlaceholders = testimonials.some((t) => t.isPlaceholder);

  return (
    <Section id={TESTIMONIALS_STRIP.id} spacing="md" tone="muted" bordered>
      <Container size="wide" className="space-y-8">
        <QuestionHeading block={TESTIMONIALS_STRIP} />

        {hasPlaceholders ? (
          <Callout variant="warn" title={TESTIMONIALS_STRIP.placeholderTitle}>
            {TESTIMONIALS_STRIP.placeholderNote}
          </Callout>
        ) : null}

        <ul className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id}>
              <figure className="flex h-full flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
                {t.rating != null ? <Rating value={t.rating} size="sm" /> : null}
                <blockquote className="flex-1 text-sm leading-relaxed">
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.clientName}</span>
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
            </li>
          ))}
        </ul>

        <Button asChild variant="link" className="px-0">
          <Link href={TESTIMONIALS_STRIP.allLink.href}>{TESTIMONIALS_STRIP.allLink.label} →</Link>
        </Button>
      </Container>
    </Section>
  );
}
