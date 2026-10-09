import type * as React from "react";
import { FigureSection } from "./figure-section";

export interface QuestionSectionProps {
  id: string;
  route?: string;
  question: string;
  answer: string;
  eyebrow?: string;
  tone?: "default" | "muted" | "gold" | "inverse";
  layout?: "split" | "stack";
  spacing?: "sm" | "md" | "lg";
  size?: "wide" | "default" | "narrow";
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * @deprecated Thin wrapper over `FigureSection` (no figure: the quiet ruled block) so pages not
 * yet migrated still build. The eyebrow, layout, spacing and size props are accepted and
 * ignored. Replace with `FigureSection` and delete this file in Phase C.
 */
export function QuestionSection({
  id,
  route,
  question,
  answer,
  tone,
  children,
  className,
}: QuestionSectionProps) {
  return (
    <FigureSection
      id={id}
      route={route}
      question={question}
      answer={answer}
      tone={tone === "muted" ? "muted" : "default"}
      className={className}
    >
      {children}
    </FigureSection>
  );
}
