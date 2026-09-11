import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Editorial page header for management screens: serif title, one-line intent, actions right. */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-accent-border/40 pb-5 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[0.68rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-3xl font-medium tracking-tight text-balance md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
