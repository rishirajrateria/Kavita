import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  COMPARISON,
  FAQ_SECTION,
  HOW_IT_WORKS,
  METHOD,
  SERVICES_OVERVIEW,
  SERVING,
  type QuestionBlock,
} from "@/content/home";

interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * Where the words live.
 *
 * The page above is pictures with a line under each. This is the quiet foot of the page that
 * keeps the site honest with search engines and AI answer engines: every question-form heading
 * and its 40–60-word self-contained answer (CLAUDE.md §9.2), plus the route's FAQs, all in the
 * served HTML. It is set as a ruled list in a narrow measure and native `<details>` — readable
 * if you want it, ignorable if you don't, and never a wall.
 */
const BLOCKS: readonly QuestionBlock[] = [
  METHOD,
  COMPARISON,
  SERVICES_OVERVIEW,
  HOW_IT_WORKS,
  SERVING,
] as const;

export function Questions({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <Section id={FAQ_SECTION.id} spacing="lg" tone="inverse" depth="deep">
      <Container size="wide">
        <div className="mx-auto max-w-[40rem]">
          <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
            {FAQ_SECTION.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight font-normal text-balance">
            {FAQ_SECTION.heading}
          </h2>
          <p className="answer mt-6 text-base">{FAQ_SECTION.answer}</p>

          <dl className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {BLOCKS.map((b) => (
              <div key={b.id} id={b.id} className="py-7">
                <dt className="font-serif text-xl leading-snug font-normal">
                  <h3 className="inline">{b.question}</h3>
                </dt>
                <dd className="answer mt-3 text-sm text-muted-foreground sm:text-base">
                  {b.answer}
                </dd>
              </div>
            ))}
          </dl>

          {faqs.length > 0 ? (
            <div className="mt-12">
              <h3 className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
                Before you book
              </h3>
              <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
                {faqs.map((f) => (
                  <details key={f.question} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-serif text-lg leading-snug [&::-webkit-details-marker]:hidden">
                      <span>{f.question}</span>
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-accent-strong transition-transform duration-(--duration-base) group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="answer mt-3 pr-8 text-sm text-muted-foreground sm:text-base">
                      {f.answer}
                    </p>
                  </details>
                ))}
              </div>
              <p className="mt-6 text-sm">
                <Link href={FAQ_SECTION.allLink.href} className="text-accent-strong">
                  {FAQ_SECTION.allLink.label} →
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
