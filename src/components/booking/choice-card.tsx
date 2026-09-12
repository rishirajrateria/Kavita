import type * as React from "react";
import { cn } from "@/lib/utils";

export interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Top-right: a lead badge, a duration. */
  meta?: React.ReactNode;
  /** Bottom line: price note, "what to prepare". */
  footer?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * One large tap target in a radio-like group (service, format). Whole card is the button;
 * the selected state is a gold hairline plus a gold dot, no colour-only cue.
 */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  meta,
  footer,
  disabled = false,
  className,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        // Solid, not glass: this sits inside the booking flow's one glass panel, and a second
        // sheet of translucency there would cost exactly the legibility a form cannot spare.
        "group relative flex min-h-20 w-full flex-col gap-2 rounded-lg border bg-background/85 p-5 text-left transition-[border-color,background-color,box-shadow,translate] duration-(--duration-base) ease-standard outline-none",
        "hover:border-accent-border hover:bg-background focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-0.5",
        selected
          ? "border-accent-border bg-accent/40 shadow-accent ring-1 ring-accent-border/60"
          : "border-border",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-5 right-5 inline-flex size-5 items-center justify-center rounded-full border transition-colors duration-(--duration-fast)",
          selected
            ? "border-cta bg-cta"
            : "border-border bg-transparent group-hover:border-accent-border",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full bg-cta-foreground transition-opacity",
            selected ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
      {meta ? (
        <span className="flex items-center gap-3 pr-8 text-xs text-muted-foreground">{meta}</span>
      ) : null}
      <span className="pr-8 font-serif text-xl leading-snug text-foreground">{title}</span>
      {description ? (
        <span className="text-sm leading-relaxed text-muted-foreground">{description}</span>
      ) : null}
      {footer ? <span className="mt-1 text-xs text-muted-foreground">{footer}</span> : null}
    </button>
  );
}
