import { QuestionHeading } from "@/components/home/question-heading";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationFaq } from "@/content/locations/schema";
import type { Question } from "./answers";

/**
 * City-specific FAQ as native `<details>` (answers always in the HTML, no accordion JS), styled
 * as on the home page. The matching FAQPage JSON-LD is emitted by the page from the same rows.
 *
 * The second of the two blocks a geo page spends `.glass` on: a question list is a thing a
 * reader opens and closes, so it earns being an object rather than a ruled paragraph. Each
 * answer keeps its `.answer` class — the gold rule and the larger type are what mark it as the
 * self-contained 40–60 word answer an assistant quotes (CLAUDE.md §9.2).
 */
export function GeoFaq({
  faqs,
  question,
  route,
  tone = "default",
}: {
  faqs: LocationFaq[];
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  tone?: "default" | "muted";
}) {
  if (faqs.length === 0) return null;

  return (
    <Section id="faq" spacing="lg" tone={tone}>
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={question} route={route} id="faq" layout="split" />

        <Card
          variant="glass"
          padding="none"
          className="divide-y divide-accent-border/20 overflow-hidden"
        >
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item group">
              <summary className="flex min-h-16 items-center justify-between gap-6 px-6 py-5 text-left transition-colors duration-(--duration-base) ease-standard hover:bg-accent/25 sm:px-8 [&::marker]:hidden">
                <Heading
                  as="h3"
                  level={4}
                  className="text-lg transition-colors duration-(--duration-base) group-hover:text-accent-strong sm:text-xl"
                >
                  {faq.question}
                </Heading>
                <span
                  aria-hidden="true"
                  className="faq-marker inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-border/50 font-serif text-2xl leading-none text-accent-strong"
                >
                  +
                </span>
              </summary>
              <div className="px-6 pb-7 sm:px-8 lg:max-w-[72ch]">
                <p className="answer text-base">{faq.answer}</p>
              </div>
            </details>
          ))}
        </Card>
      </Container>
    </Section>
  );
}
