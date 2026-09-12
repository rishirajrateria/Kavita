import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FAQ_SECTION } from "@/content/home";
import type { Faq } from "@/lib/data";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";

/**
 * Home FAQ as plain server-rendered HTML — every question an H3 under one question-phrased H2.
 * Each item is a native `<details>`: the answer is always in the markup (no accordion JS), the
 * gold "+" turns into "×" with CSS alone, and the matching FAQPage JSON-LD is emitted by the
 * page from the same rows.
 */
export async function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  const overrides = await getAnswerOverridesForRoute("/");
  const answer = pickAnswer(overrides, FAQ_SECTION.id, FAQ_SECTION.answer);

  return (
    <Section id={FAQ_SECTION.id} spacing="lg">
      <Container size="wide" className="space-y-14">
        <div className="reveal grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-end lg:gap-16">
          <Heading
            as="h2"
            level={2}
            eyebrow={FAQ_SECTION.eyebrow}
            className="max-w-[22ch] text-4xl leading-[1.08]"
          >
            {FAQ_SECTION.heading}
          </Heading>
          <p className="answer">{answer}</p>
        </div>

        <div className="divide-y divide-border/60 border-t border-b border-t-accent-border/40 border-b-border/60">
          {faqs.map((faq) => (
            <details key={faq.id} className="faq-item group">
              <summary className="flex min-h-16 items-center justify-between gap-8 py-5 pr-1 text-left [&::marker]:hidden">
                <Heading
                  as="h3"
                  level={4}
                  className="max-w-[46ch] text-lg transition-colors duration-(--duration-base) group-hover:text-accent-strong sm:text-xl"
                >
                  {faq.question}
                </Heading>
                <span
                  aria-hidden="true"
                  className="faq-marker inline-flex size-8 shrink-0 items-center justify-center font-serif text-3xl leading-none font-light text-accent-strong"
                >
                  +
                </span>
              </summary>
              <div className="pb-8 lg:max-w-[68%]">
                <p className="answer text-base">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <Button asChild variant="link">
          <Link href={FAQ_SECTION.allLink.href}>{FAQ_SECTION.allLink.label} →</Link>
        </Button>
      </Container>
    </Section>
  );
}
