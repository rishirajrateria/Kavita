import type * as React from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { BOOK_NAV, BOOK_STEPS } from "@/content/pages/book";
import { cn } from "@/lib/utils";
import type { StepIndex } from "./state";

export interface StepFrameProps {
  step: StepIndex;
  /** Focus target: the heading receives focus after every step change. */
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
  /** Rendered above the footer, e.g. an error callout. */
  notice?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * The card every step renders inside: eyebrow "Step n of 7", the question as H2, the hint,
 * the body, then Back / Continue. Same chrome at every step so nothing jumps.
 */
export function StepFrame({
  step,
  headingRef,
  onBack,
  onNext,
  nextLabel = BOOK_NAV.next,
  nextDisabled = false,
  nextBusy = false,
  notice,
  children,
  className,
}: StepFrameProps) {
  const copy = BOOK_STEPS[step];
  return (
    <div className={cn("flex min-h-full flex-col", className)}>
      <header className="border-b border-accent-border/30 pb-6">
        <p className="mb-3 flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase before:h-px before:w-8 before:shrink-0 before:bg-accent-border">
          {BOOK_NAV.stepOf(step + 1, BOOK_STEPS.length)}
        </p>
        <Heading
          as="h2"
          level={2}
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-28 text-3xl outline-none sm:text-4xl"
        >
          {copy.title}
        </Heading>
        {copy.hint ? (
          <p className="mt-3 max-w-[40rem] text-base leading-relaxed text-muted-foreground">
            {copy.hint}
          </p>
        ) : null}
      </header>

      <div className="flex-1 py-6 sm:py-8">{children}</div>

      {notice ? (
        <div className="mb-6 scroll-mt-28 outline-none" data-booking-notice tabIndex={-1}>
          {notice}
        </div>
      ) : null}

      {onBack || onNext ? (
        <footer className="flex flex-wrap-reverse items-center justify-between gap-3 border-t border-accent-border/30 pt-6">
          {onBack ? (
            <Button type="button" variant="ghost" size="lg" onClick={onBack} className="-ml-3">
              <ArrowLeftIcon aria-hidden="true" />
              {BOOK_NAV.back}
            </Button>
          ) : (
            <span />
          )}
          {onNext ? (
            <Button
              type="button"
              variant="gold"
              size="xl"
              onClick={onNext}
              disabled={nextDisabled || nextBusy}
              aria-busy={nextBusy || undefined}
              className="min-w-40"
            >
              {nextLabel}
            </Button>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
