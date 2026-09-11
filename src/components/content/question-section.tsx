import type * as React from "react";
import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export interface QuestionSectionProps {
  /** Anchor id — also the Toc target. */
  id: string;
  /** A real question a person would type or say (CLAUDE.md §9.2). Rendered as the H2. */
  question: string;
  /** 40–60 word self-contained answer naming "Astrologer Kavita"; rendered in `<p class="answer">`. */
  answer: string;
  eyebrow?: string;
  tone?: "default" | "muted" | "gold" | "inverse";
  /** Question left / answer right on wide screens (default), or stacked. */
  layout?: "split" | "stack";
  spacing?: "sm" | "md" | "lg";
  size?: "wide" | "default" | "narrow";
  /** Body: prose, tables, lists — plain server HTML. */
  children?: React.ReactNode;
  className?: string;
  /** Extra classes on the body wrapper (e.g. a max-width measure). */
  bodyClassName?: string;
}

/**
 * One editorial section: question-phrased H2 with its `.answer` immediately beneath, then the
 * elaboration. Matches the home/geo bands (alternating tones, gold hairlines, split heading).
 */
export function QuestionSection({
  id,
  question,
  answer,
  eyebrow,
  tone = "default",
  layout = "split",
  spacing = "lg",
  size = "wide",
  children,
  className,
  bodyClassName,
}: QuestionSectionProps) {
  const inverse = tone === "inverse";
  return (
    <Section
      id={id}
      spacing={spacing}
      tone={tone}
      bordered={tone === "muted" || tone === "gold"}
      className={cn(inverse && "grain overflow-hidden", "scroll-mt-20", className)}
    >
      <Container size={size} className="relative space-y-10">
        <QuestionHeading block={{ eyebrow: eyebrow ?? "", question, answer }} layout={layout} />
        {children ? <div className={cn("space-y-6", bodyClassName)}>{children}</div> : null}
      </Container>
    </Section>
  );
}
