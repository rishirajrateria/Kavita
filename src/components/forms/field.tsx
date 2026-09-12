import type * as React from "react";
import { AlertCircleIcon, ChevronDownIcon } from "lucide-react";
import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + hint + error, wired with `aria-describedby`. Server-safe, no JS. */
export function Field({ id, label, hint, errors, required, children, className }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div
      className={cn("space-y-2", className)}
      data-field={id}
      data-invalid={errorId ? "" : undefined}
    >
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-accent-strong">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {/*
       * An error has to survive both palettes and a quick scan: the icon carries it when colour
       * alone would not, and `--error` is a token pair that is legible on either ground.
       */}
      {errorId ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm leading-snug font-medium text-error"
        >
          <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{errors?.join(" ")}</span>
        </p>
      ) : null}
    </div>
  );
}

/** `aria-describedby` value for a control inside a Field. */
export function describedBy(id: string, hint?: string, errors?: string[]): string | undefined {
  const ids = [hint ? `${id}-hint` : null, errors?.length ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/**
 * Native `<select>` — works without JavaScript, which the Radix Select cannot.
 *
 * It inherits `fieldClassName` from the Input primitive rather than restating it, so the two
 * controls can never drift apart; only the things a select needs on top (the chevron, the
 * cursor, the option colours a dark UA would otherwise get wrong) are added here.
 */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          fieldClassName,
          "h-11 cursor-pointer appearance-none pr-10",
          "[&>option]:bg-popover [&>option]:text-popover-foreground",
          className,
        )}
        {...props}
      />
      {/* A real element rather than a data-URI chevron, so the arrow reads a theme token. */}
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-accent-strong"
      />
    </div>
  );
}
