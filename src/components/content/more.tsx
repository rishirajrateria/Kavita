import type * as React from "react";
import { cn } from "@/lib/utils";

export interface MoreProps {
  summary?: string;
  children: React.ReactNode;
  open?: boolean;
  className?: string;
}

/**
 * The fold under a plate: a native `<details>` holding the elaboration that is in the HTML but
 * not on the eye at rest (SPEC §2.3). It never holds an H2, an `.answer`, a primary table, an
 * honesty list or a link that exists nowhere else on the page — those stay visible. May hold
 * `<h3>`, paragraphs, `<ol>` step bodies and secondary tables.
 */
export function More({ summary = "Read more", children, open = false, className }: MoreProps) {
  return (
    <details className={cn("more mx-auto max-w-[60ch]", className)} open={open}>
      <summary className="flex min-h-11 cursor-pointer items-center gap-3 font-display text-[0.68rem] font-semibold tracking-[0.22em] text-accent-strong uppercase [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="faq-marker inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-accent-border/50 font-serif text-lg leading-none text-accent-strong"
        >
          +
        </span>
        {summary}
      </summary>
      <div className="prose-quiet mt-4 space-y-5 font-sans text-base leading-[1.65] text-muted-foreground [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-normal [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-4 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </details>
  );
}
