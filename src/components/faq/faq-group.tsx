import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";
import type { FaqItem } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

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

/** A group from `lg`: question left, answer right — the `Foot`'s ledger. */
const LEDGER = "lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-x-12";
/** The items: one column, two from `lg`; each rules itself above, the list below. */
const FAQ_GRID = "grid border-b border-border/60 lg:grid-cols-2 lg:gap-x-12";

/**
 * One topic on the master FAQ, in the ruled voice of the "Notes to the plates" foot (SPEC §3):
 * the eyebrow as a plate numeral, the question H2 quiet beside its visible answer, each
 * subgroup's name as an H3 (a link when it has a page), and the questions as native
 * `<details>` in two columns. Every answer is in the HTML; `data-faq` lets the client filter
 * hide non-matches (matching on `textContent`) with the `hidden` attribute without touching
 * content. Not an inverse band: the groups alternate default and muted panes on the sky.
 */
export async function FaqGroup({
  id,
  route,
  eyebrow,
  heading,
  answer: ownAnswer,
  subgroups,
  tone = "default",
}: FaqGroupProps) {
  const total = subgroups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) return null;
  const overrides = route && ownAnswer ? await getAnswerOverridesForRoute(route) : {};
  const answer = ownAnswer ? pickAnswer(overrides, id, ownAnswer) : undefined;

  return (
    <Section id={id} spacing="lg" tone={tone} className="foot scroll-mt-20" data-faq-group={id}>
      <Container size="wide">
        <div className="mx-auto max-w-[64rem]">
          <p className="plate-n">{eyebrow}</p>
          <div className={cn("mt-8 border-t border-border/60 py-5", LEDGER)}>
            <h2 className="note-q lg:pr-4">{heading}</h2>
            {answer ? (
              <p className="answer mt-3 font-serif text-[1.15rem] leading-[1.55] lg:mt-0">
                {answer}
              </p>
            ) : null}
          </div>

          <div className="space-y-10">
            {subgroups.map((g) => (
              <div key={`${g.href ?? ""}#${g.title}`} data-faq-subgroup>
                {subgroups.length > 1 || g.href ? (
                  <h3 className="font-display text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
                    {g.href ? (
                      <a href={g.href} className="no-underline hover:underline">
                        {g.title}
                      </a>
                    ) : (
                      g.title
                    )}
                  </h3>
                ) : null}
                <div className={cn(FAQ_GRID, subgroups.length > 1 || g.href ? "mt-3" : "")}>
                  {g.items.map((faq) => (
                    <details
                      key={faq.question}
                      className="faq-item group border-t border-border/60 py-4"
                      data-faq
                    >
                      <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 text-left [&::-webkit-details-marker]:hidden">
                        <h4 className="font-serif text-lg leading-snug font-normal tracking-normal">
                          {faq.question}
                        </h4>
                        <span
                          aria-hidden="true"
                          className="faq-marker mt-1 shrink-0 font-serif text-xl leading-none text-accent-strong"
                        >
                          +
                        </span>
                      </summary>
                      <p className="answer mt-3 pr-8 text-base text-muted-foreground">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
