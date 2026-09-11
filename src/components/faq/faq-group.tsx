import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { FaqItem } from "@/lib/seo/schema";

export interface FaqSubgroup {
  /** e.g. a service name or a city; rendered as an H3 above its questions. */
  title: string;
  href?: string;
  items: FaqItem[];
}

export interface FaqGroupProps {
  id: string;
  /** Canonical route of the page, for `/admin/aeo` answer overrides keyed by `(route, id)`. */
  route?: string;
  eyebrow: string;
  heading: string;
  /** Present on groups whose H2 has its own 40–60 word answer. */
  answer?: string;
  subgroups: FaqSubgroup[];
  tone?: "default" | "muted";
}

/**
 * One topic on the master FAQ: question H2 (+ answer), then subgroups of `<details>`. Every
 * answer is in the HTML; `data-faq` lets the client filter hide non-matches (matching on
 * `textContent`) with the `hidden` attribute without touching content.
 */
export function FaqGroup({
  id,
  route,
  eyebrow,
  heading,
  answer,
  subgroups,
  tone = "default",
}: FaqGroupProps) {
  const total = subgroups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) return null;

  return (
    <Section
      id={id}
      spacing="lg"
      tone={tone}
      bordered={tone === "muted"}
      className="scroll-mt-20"
      data-faq-group={id}
    >
      <Container size="wide" className="space-y-10">
        {answer ? (
          <QuestionHeading
            block={{ eyebrow, question: heading, answer }}
            route={route}
            id={id}
            layout="split"
          />
        ) : (
          <Heading as="h2" level={2} eyebrow={eyebrow} className="max-w-[26ch]">
            {heading}
          </Heading>
        )}

        {subgroups.map((g) => (
          <div key={g.title} data-faq-subgroup className="space-y-4">
            {subgroups.length > 1 || g.href ? (
              <Heading as="h3" level={4} className="text-accent-strong">
                {g.href ? (
                  <a href={g.href} className="no-underline hover:underline">
                    {g.title}
                  </a>
                ) : (
                  g.title
                )}
              </Heading>
            ) : null}
            <div className="divide-y divide-accent-border/40 border-y border-accent-border/40">
              {g.items.map((faq) => (
                <details key={faq.question} className="faq-item group" data-faq>
                  <summary className="flex min-h-14 items-center justify-between gap-6 py-4 pr-1 text-left [&::marker]:hidden">
                    <Heading as="h4" level={4} className="text-lg sm:text-xl">
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
          </div>
        ))}
      </Container>
    </Section>
  );
}
