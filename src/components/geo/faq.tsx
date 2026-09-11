import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationFaq } from "@/content/locations/schema";
import type { Question } from "./answers";

/**
 * City-specific FAQ as native `<details>` (answers always in the HTML, no accordion JS), styled
 * as on the home page. The matching FAQPage JSON-LD is emitted by the page from the same rows.
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
    <Section id="faq" spacing="lg" tone={tone} bordered={tone === "muted"}>
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={question} route={route} id="faq" layout="split" />

        <div className="divide-y divide-accent-border/40 border-y border-accent-border/40">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item group">
              <summary className="flex min-h-14 items-center justify-between gap-6 py-4 pr-1 text-left [&::marker]:hidden">
                <Heading as="h3" level={4} className="text-lg sm:text-xl">
                  {faq.question}
                </Heading>
                <span
                  aria-hidden="true"
                  className="faq-marker inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-border/60 font-serif text-2xl leading-none text-accent-strong"
                >
                  +
                </span>
              </summary>
              <div className="pb-6 lg:max-w-[70%]">
                <p className="answer text-base">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
