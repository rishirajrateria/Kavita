import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FAQ_SECTION } from "@/content/home";
import type { Faq } from "@/lib/data";

/**
 * Home FAQ as plain server-rendered HTML — every question an H3 under one question-phrased H2,
 * every answer visible in the markup (no accordion, nothing behind JS). The matching FAQPage
 * JSON-LD is emitted by the page from the same rows.
 */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <Section id={FAQ_SECTION.id} spacing="md" tone="muted" bordered>
      <Container size="wide" className="space-y-10">
        <div className="space-y-5">
          <Heading as="h2" level={2} eyebrow={FAQ_SECTION.eyebrow}>
            {FAQ_SECTION.heading}
          </Heading>
          <p className="answer">{FAQ_SECTION.answer}</p>
        </div>

        <dl className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-t border-accent-border/50 pt-5">
              <dt>
                <Heading as="h3" level={4}>
                  {faq.question}
                </Heading>
              </dt>
              <dd className="mt-3">
                <p className="answer text-base">{faq.answer}</p>
              </dd>
            </div>
          ))}
        </dl>

        <Button asChild variant="link" className="px-0">
          <Link href={FAQ_SECTION.allLink.href}>{FAQ_SECTION.allLink.label} →</Link>
        </Button>
      </Container>
    </Section>
  );
}
