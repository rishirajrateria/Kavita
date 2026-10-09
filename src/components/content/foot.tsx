import Link from "next/link";
import type * as React from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { PageSeoExtras } from "@/components/seo/page-seo-extras";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";
import { getAttachedFaqs } from "@/lib/seo/faq-attach";
import { faqPageSchema, withSpeakable, type FaqItem } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";
import { Byline, type BylineProps } from "./byline";

export interface FootBlock {
  /** Anchor id — the Toc target, and the `h2_id` an admin answer override is keyed by. */
  id: string;
  /** A real question; rendered as a quiet `<h2 class="note-q">`. */
  question: string;
  /** Its 40–60 word `.answer`, always visible. */
  answer: string;
  /** `More`, `Ledger`, `StepLine`, a link — plain server HTML under the answer. */
  children?: React.ReactNode;
}

export interface FootProps {
  id?: string;
  /** Canonical route: attached admin FAQs, head extras and answer overrides are read for it. */
  route?: string;
  eyebrow?: string;
  /** The FAQ heading, phrased as a question; its `answer` stays an `.answer`. */
  heading?: string;
  answer?: string;
  blocks?: FootBlock[];
  faqs: FaqItem[];
  /** Render the FAQ answers open (geo pages) instead of inside `<details>`. */
  faqVisible?: boolean;
  allLink?: { label: string; href: string };
  /** Emit FAQPage JSON-LD (speakable on `.answer`). Default true. */
  withSchema?: boolean;
  byline?: BylineProps;
  children?: React.ReactNode;
  className?: string;
}

const ANSWER = "answer mt-3 font-serif text-[1.15rem] leading-[1.55]";
/** A block from `lg`: question left, answer and its fold right. */
const LEDGER = "lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-x-12";
/** The FAQ items: one column, two from `lg`; each item rules itself above, the list below. */
const FAQ_GRID = "mt-6 grid border-b border-border/60 lg:grid-cols-2 lg:gap-x-12";

/**
 * "Notes to the plates" — the quiet ruled foot of a page (SPEC §2.3) where every question-form
 * H2 that has no plate of its own lives with its visible answer, followed by the route's FAQs
 * as native `<details>` (or open, when `faqVisible`), the "all" link and the byline. Attached
 * admin FAQs, the page's head extras and the FAQPage JSON-LD are emitted here.
 *
 * Each block is a `<div>` holding the `<h2>` and its `<p class="answer">` (heading content is
 * not permitted inside a `<dt>`), so the H2 count and the H2 → `.answer` adjacency both hold.
 * From `lg` a block is a two-column ledger — the question in a narrow left column, the answer
 * and whatever folds beneath it on the right — and the FAQ items run in two columns, so the
 * foot is a ruled table of notes rather than a column of heading/paragraph pairs.
 *
 * The foot is a muted pane on the page surface, not an inverse band (ruling, fix round 1): with
 * every answer and FAQ in it the foot runs to ~2,000 px, and as inverse it made the light theme
 * read as a mostly-dark page. The `CtaDisc` and the footer are the page's one deep band.
 */
export async function Foot({
  id = "faq",
  route,
  eyebrow = "Notes to the plates",
  heading,
  answer: headingAnswer,
  blocks = [],
  faqs: ownFaqs,
  faqVisible = false,
  allLink,
  withSchema = true,
  byline,
  children,
  className,
}: FootProps) {
  const [attached, overrides] = await Promise.all([
    route ? getAttachedFaqs(route) : Promise.resolve([]),
    route ? getAnswerOverridesForRoute(route) : Promise.resolve({}),
  ]);
  const seen = new Set(ownFaqs.map((f) => f.question.trim().toLowerCase()));
  const faqs = [...ownFaqs, ...attached.filter((f) => !seen.has(f.question.trim().toLowerCase()))];

  return (
    <Section id={id} spacing="lg" tone="muted" className={cn("foot scroll-mt-20", className)}>
      {withSchema && faqs.length > 0 ? (
        <JsonLd data={withSpeakable(faqPageSchema(faqs), [".answer"])} />
      ) : null}
      {route ? <PageSeoExtras route={route} /> : null}

      <Container size="wide">
        <div className="mx-auto max-w-[64rem]">
          <p className="plate-n">{eyebrow}</p>

          {blocks.length > 0 ? (
            <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
              {blocks.map((b) => (
                <div key={b.id} id={b.id} className={cn("scroll-mt-20 py-5", LEDGER)}>
                  <h2 className="note-q lg:pr-4">{b.question}</h2>
                  <p className={cn(ANSWER, "lg:mt-0")}>{pickAnswer(overrides, b.id, b.answer)}</p>
                  {b.children ? (
                    <div className="mt-4 space-y-6 lg:col-start-2">{b.children}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {heading ? (
            <>
              <h2 className={cn("note-q", blocks.length > 0 ? "mt-12" : "mt-8")}>{heading}</h2>
              {headingAnswer ? (
                <p className={cn(ANSWER, "max-w-[44rem]")}>
                  {pickAnswer(overrides, id, headingAnswer)}
                </p>
              ) : null}
            </>
          ) : null}

          {faqs.length > 0 ? (
            faqVisible ? (
              <div className={cn("faq-open", FAQ_GRID)}>
                {faqs.map((f) => (
                  <div key={f.question} className="border-t border-border/60 py-5">
                    <h3 className="font-serif text-lg leading-snug font-normal">{f.question}</h3>
                    <p className="answer mt-3 text-base text-muted-foreground">{f.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={FAQ_GRID}>
                {faqs.map((f) => (
                  <details
                    key={f.question}
                    className="faq-item group border-t border-border/60 py-4"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 text-left [&::-webkit-details-marker]:hidden">
                      <h3 className="font-serif text-lg leading-snug font-normal tracking-normal">
                        {f.question}
                      </h3>
                      <span
                        aria-hidden="true"
                        className="faq-marker mt-1 shrink-0 font-serif text-xl leading-none text-accent-strong"
                      >
                        +
                      </span>
                    </summary>
                    <p className="answer mt-3 pr-8 text-base text-muted-foreground">{f.answer}</p>
                  </details>
                ))}
              </div>
            )
          ) : null}

          {allLink ? (
            <p className="mt-6 text-sm">
              <Link href={allLink.href} className="text-accent-strong">
                {allLink.label} →
              </Link>
            </p>
          ) : null}

          {byline ? <Byline {...byline} withoutPhoto className="mt-12" /> : null}
          {children}
        </div>
      </Container>
    </Section>
  );
}
