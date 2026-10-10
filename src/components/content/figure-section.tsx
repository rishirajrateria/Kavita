import type * as React from "react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";
import { cn } from "@/lib/utils";
import { Rule } from "./rule";

export interface FigureSectionProps {
  /** Anchor id — the Toc target, and the `h2_id` an admin answer override is keyed by. */
  id: string;
  /** Canonical route of the page; with it an answer saved in `/admin/aeo` replaces `answer`. */
  route?: string;
  /** Plate numeral, e.g. `"I"` — rendered as `Plate I`. */
  n?: string;
  /** A real question a person would type or say (CLAUDE.md §9.2). The H2. */
  question: string;
  /** 40–60 word self-contained answer; rendered in `<p class="answer">` right after the H2. */
  answer: string;
  /** One ruled line under the figure — a caption, three words, never a heading. */
  line?: React.ReactNode;
  /** The instrument. Without it the section is a quiet ruled block. */
  figure?: React.ReactNode;
  /** 36 · 52 · 72 rem. No two adjacent sections share a width. */
  figureWidth?: "narrow" | "default" | "wide";
  figureRatio?: "3/2" | "1/1" | "2/1" | "16/9";
  /** `column`: figure left, prose right, everything visible — geo pages and long notes. */
  layout?: "centre" | "column";
  tone?: "default" | "muted";
  /** `More`, `Ledger`, `DoorField`, ruled lists — plain server HTML. */
  children?: React.ReactNode;
  className?: string;
}

const WIDTH: Record<NonNullable<FigureSectionProps["figureWidth"]>, string> = {
  narrow: "36rem",
  default: "52rem",
  wide: "72rem",
};

const RATIO: Record<NonNullable<FigureSectionProps["figureRatio"]>, string> = {
  "3/2": "3 / 2",
  "1/1": "1 / 1",
  "2/1": "2 / 1",
  "16/9": "16 / 9",
};

const H2 =
  "font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-[1.1] font-normal tracking-normal text-foreground";
const ANSWER = "answer font-serif text-[1.15rem] leading-[1.55]";

/**
 * One plate (SPEC §2.3): the figure, one ruled line, the question-form H2 and its visible
 * 40–60-word `.answer`, then whatever folds beneath. Always in that order, always in the
 * served HTML; anchors sit on the `<section>`, never inside a `<details>`.
 */
export async function FigureSection({
  id,
  route,
  n,
  question,
  answer: ownAnswer,
  line,
  figure,
  figureWidth = "default",
  figureRatio,
  layout = "centre",
  tone = "default",
  children,
  className,
}: FigureSectionProps) {
  const overrides = route ? await getAnswerOverridesForRoute(route) : {};
  const answer = pickAnswer(overrides, id, ownAnswer);
  const figureStyle: React.CSSProperties = {
    maxWidth: WIDTH[figureWidth],
    aspectRatio: figureRatio ? RATIO[figureRatio] : undefined,
    ["--parallax-depth" as string]: "14px",
  };
  const column = layout === "column" && figure;

  if (!figure) {
    return (
      <Section id={id} spacing="lg" tone={tone} className={cn("scroll-mt-20", className)}>
        <Container size="wide">
          <div className="mx-auto max-w-[40rem] border-t border-accent-border/30 pt-10">
            {n ? <p className="plate-n">Plate {n}</p> : null}
            <h2 className={cn(H2, "mt-4 max-w-[22ch]")}>{question}</h2>
            <p className={cn(ANSWER, "mt-5 max-w-none")}>{answer}</p>
            {children ? <div className="mt-8 space-y-6">{children}</div> : null}
          </div>
        </Container>
      </Section>
    );
  }

  if (column) {
    return (
      <Section id={id} spacing="lg" tone={tone} className={cn("scroll-mt-20", className)}>
        <Container size="wide" className="lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            {n ? <p className="plate-n">Plate {n}</p> : null}
            <figure
              data-parallax
              className="relative mx-auto mt-4 flex w-full items-center justify-center"
              style={figureStyle}
            >
              {figure}
            </figure>
            {line ? (
              <Rule tone="muted" as="p" className="mt-6">
                {line}
              </Rule>
            ) : null}
          </div>
          <div className="mt-8 lg:col-span-7 lg:mt-0">
            <h2 className={cn(H2, "max-w-[22ch]")}>{question}</h2>
            <p className={cn(ANSWER, "mt-5 max-w-none")}>{answer}</p>
            {children ? <div className="mt-8 space-y-6">{children}</div> : null}
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id={id} spacing="lg" tone={tone} className={cn("scroll-mt-20", className)}>
      <Container size="wide">
        {n ? <p className="plate-n text-center">Plate {n}</p> : null}
        <figure
          data-parallax
          className="relative mx-auto mt-6 flex w-full items-center justify-center"
          style={figureStyle}
        >
          {figure}
        </figure>
        {line ? (
          <Rule tone="muted" as="p" className="mt-6 justify-center text-center">
            {line}
          </Rule>
        ) : null}
        <h2 className={cn(H2, "mx-auto mt-4 max-w-[22ch] text-center")}>{question}</h2>
        <p className={cn(ANSWER, "mx-auto mt-5 max-w-[36rem] border-s-0 ps-0 text-center")}>
          {answer}
        </p>
        {children ? (
          <div className="mx-auto mt-8 max-w-[60ch] space-y-6 [&>.more>summary]:justify-center">
            {children}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
