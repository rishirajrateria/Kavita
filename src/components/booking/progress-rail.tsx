import { CheckIcon } from "lucide-react";
import { BOOK_STEPS } from "@/content/pages/book";
import { cn } from "@/lib/utils";
import type { StepIndex } from "./state";

export interface ProgressRailProps {
  current: StepIndex;
  reached: StepIndex;
  onJump: (step: StepIndex) => void;
  /** Once booked, the rail is static. */
  locked?: boolean;
}

/**
 * The seven-step rail: vertical beside the card on wide screens, a horizontal strip above it
 * on phones. The current step is a solid gold disc, completed steps a gold tick and a link
 * back, upcoming steps a hairline ring. Fixed size so it never reflows between steps.
 */
export function ProgressRail({ current, reached, onJump, locked = false }: ProgressRailProps) {
  return (
    <nav aria-label="Booking steps">
      <ol className="flex snap-x gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {BOOK_STEPS.map((step, index) => {
          const i = index as StepIndex;
          const isCurrent = i === current;
          const isDone = i < current || (locked && i <= current);
          const canJump = !locked && !isCurrent && i <= reached && i < 6;
          const label = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border font-sans text-xs font-semibold tabular-nums transition-[background-color,border-color,color] duration-(--duration-base) ease-standard",
                  isCurrent && "border-cta bg-cta text-cta-foreground shadow-cta",
                  isDone && !isCurrent && "border-accent-border bg-accent text-accent-strong",
                  !isCurrent && !isDone && "border-border text-muted-foreground",
                )}
              >
                {isDone && !isCurrent ? (
                  <CheckIcon className="size-4" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                  isDone && !isCurrent && "text-foreground",
                )}
              >
                {step.short}
              </span>
            </>
          );
          return (
            <li
              key={step.key}
              className={cn(
                "relative flex shrink-0 snap-start items-center lg:py-2",
                // Vertical connector between discs on wide screens.
                "lg:before:absolute lg:before:top-[calc(50%+1.25rem)] lg:before:left-4 lg:before:h-[calc(100%-2rem)] lg:before:w-px lg:before:bg-accent-border/40 lg:last:before:hidden",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="group flex min-h-11 items-center gap-3 rounded-md pr-3 text-left hover:[&>span:last-child]:text-accent-strong"
                  aria-label={`Go back to step ${index + 1}: ${step.short}`}
                >
                  {label}
                </button>
              ) : (
                <span className="flex min-h-11 items-center gap-3 pr-3">{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
