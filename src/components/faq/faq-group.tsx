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

/** The group's H2 at the plate question's size (SPEC §2.1), so each group opens like a plate. */
const H2 =
  "font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-[1.1] font-normal tracking-normal text-foreground";
/** The items: one column, two from `lg`; each rules itself above, the list below. */
const FAQ_GRID = "grid border-b border-border/60 lg:grid-cols-2 lg:gap-x-12";

/**
 * One topic on the master FAQ, in the ruled voice of the "Notes to the plates" foot (SPEC §3):
 * the eyebrow as a plate numeral, the question H2 at the plate size above its visible answer,
 * each subgroup's name as an H3 (a link when it has a page), and the questions as native
 * `<details>` in two columns, quieter than the H2. A group with one untitled subgroup has no
 * H3, so its questions are H3s themselves — the outline never skips a level. Every answer is in the HTML; `data-faq` lets the client filter
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
          <div className="mt-6 border-t border-accent-border/30 pt-8">
            <h2 className={cn(H2, "max-w-[22ch]")}>{heading}</h2>
            {answer ? (
              <p className="answer mt-5 max-w-[40rem] font-serif text-[1.15rem] leading-[1.55]">
                {answer}
              </p>
            ) : null}
          </div>

          <div className="mt-10 space-y-10">
            {subgroups.map((g) => {
              const titled = subgroups.length > 1 || Boolean(g.href);
              const Q = titled ? "h4" : "h3";
              return (
                <div key={`${g.href ?? ""}#${g.title}`} data-faq-subgroup>
                  {titled ? (
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
                  <div className={cn(FAQ_GRID, titled ? "mt-3" : "")}>
                    {g.items.map((faq) => (
                      <details
                        key={faq.question}
                        className="faq-item group border-t border-border/60 py-4"
                        data-faq
                      >
                        <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 text-left [&::-webkit-details-marker]:hidden">
                          <Q className="font-serif text-base leading-snug font-normal tracking-normal text-foreground/90">
                            {faq.question}
                          </Q>
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
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
