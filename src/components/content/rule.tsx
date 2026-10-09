import type * as React from "react";
import { cn } from "@/lib/utils";

export interface RuleProps {
  children: React.ReactNode;
  /** `accent`: the tagline under an H1. `muted`: the caption under a figure. */
  tone?: "accent" | "muted";
  as?: "p" | "span" | "figcaption";
  className?: string;
}

/**
 * A line of Cinzel capitals between two hairlines — the tagline under every H1 and the one
 * line under every figure (SPEC §2.3). Decorative framing around real text: it never holds a
 * heading. The hairlines draw themselves once (`.rule` in src/styles/scene.css).
 */
export function Rule({ children, tone = "accent", as: Comp = "p", className }: RuleProps) {
  return (
    <Comp className={cn("rule", className)} data-tone={tone}>
      <span
        aria-hidden="true"
        data-draw
        className="h-px w-10 shrink-0 bg-accent-border/70 sm:w-16"
        style={{ ["--draw-length" as string]: "64" }}
      />
      <span>{children}</span>
      <span
        aria-hidden="true"
        data-draw
        className="h-px w-10 shrink-0 bg-accent-border/70 sm:w-16"
        style={{ ["--draw-length" as string]: "64" }}
      />
    </Comp>
  );
}
