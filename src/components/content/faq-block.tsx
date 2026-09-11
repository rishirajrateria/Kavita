import { QuestionHeading } from "@/components/home/question-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { PageSeoExtras } from "@/components/seo/page-seo-extras";
import { getAttachedFaqs } from "@/lib/seo/faq-attach";
import { faqPageSchema, withSpeakable, type FaqItem } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

export interface FaqBlockProps {
  /** The H2 — phrased as a question, e.g. "What do people ask before booking?". */
  heading: string;
  /** 40–60 word `.answer` under the H2; omit only when the page already answers it above. */
  answer?: string;
  eyebrow?: string;
  items: FaqItem[];
  id?: string;
  tone?: "default" | "muted";
  /** Emit FAQPage JSON-LD (speakable on `.answer`). Default true; set false if the page emits its own. */
  withSchema?: boolean;
  className?: string;
  /**
   * The page's route (e.g. `/services/kundli-analysis`). When given, FAQs attached to the
   * route from the admin (`faq_attachments`, exact or glob) are appended after `items`, and
   * the page's custom-head extras (JSON-LD, links) from `page_seo` are rendered here too.
   */
  route?: string;
}

/**
 * FAQ as native `<details>` (every answer always in the HTML, no accordion JS), styled as on
 * the home and geo pages, plus the matching FAQPage JSON-LD from the same rows.
 */
export async function FaqBlock({
  heading,
  answer,
  eyebrow = "Questions",
  items: ownItems,
  id = "faq",
  tone = "default",
  withSchema = true,
  className,
  route,
}: FaqBlockProps) {
  const attached = route ? await getAttachedFaqs(route) : [];
  const seen = new Set(ownItems.map((f) => f.question.trim().toLowerCase()));
  const items = [
    ...ownItems,
    ...attached.filter((f) => !seen.has(f.question.trim().toLowerCase())),
  ];
  if (items.length === 0) return route ? <PageSeoExtras route={route} /> : null;

  return (
    <Section
      id={id}
      spacing="lg"
      tone={tone}
      bordered={tone === "muted"}
      className={cn("scroll-mt-20", className)}
    >
      {withSchema ? <JsonLd data={withSpeakable(faqPageSchema(items), [".answer"])} /> : null}
      {route ? <PageSeoExtras route={route} /> : null}
      <Container size="wide" className="space-y-10">
        {answer ? (
          <QuestionHeading block={{ eyebrow, question: heading, answer }} layout="split" />
        ) : (
          <Heading as="h2" level={2} eyebrow={eyebrow} className="max-w-[26ch]">
            {heading}
          </Heading>
        )}

        <div className="divide-y divide-accent-border/40 border-y border-accent-border/40">
          {items.map((faq) => (
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
