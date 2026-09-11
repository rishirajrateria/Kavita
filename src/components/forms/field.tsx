import type * as React from "react";
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
    <div className={cn("space-y-1.5", className)} data-field={id}>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
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
      {errorId ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-error">
          {errors?.join(" ")}
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

/** Native `<select>` styled like the Input primitive; works without JavaScript. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}
