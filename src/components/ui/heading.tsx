import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Cormorant is a high-contrast display serif: at large sizes its thin strokes are the point, so
 * the big steps run at `font-normal` with tighter tracking, and weight is only added back at the
 * small end where a serif at 400 would stop reading as a heading. This is deliberately lighter
 * than the base `h1..h6` rule in globals.css, which these utilities override.
 */
const headingVariants = cva("font-serif tracking-tight text-balance", {
  variants: {
    level: {
      display: "text-6xl leading-none font-normal tracking-[-0.02em]",
      1: "text-5xl font-normal tracking-[-0.018em]",
      2: "text-3xl font-normal",
      3: "text-2xl font-normal",
      4: "text-xl font-medium",
      5: "text-lg font-medium",
      6: "text-base font-semibold",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-accent-strong",
      inherit: "",
    },
  },
  defaultVariants: {
    level: 2,
    tone: "default",
  },
});

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";

export interface HeadingProps
  extends Omit<React.ComponentProps<"h2">, "children">, VariantProps<typeof headingVariants> {
  /** Semantic element. Defaults to h{level} (or h1 for "display"). */
  as?: HeadingTag;
  /**
   * Optional small-caps eyebrow with a short gold hairline before it, rendered above the
   * heading text. Centre it with `[&>[data-slot=eyebrow]]:justify-center` on the heading.
   */
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Heading decouples semantics (`as`) from visual size (`level`) so the document
 * outline stays correct — exactly one h1 per page — whatever the design needs.
 */
function Heading({
  as,
  level = 2,
  tone = "default",
  eyebrow,
  className,
  children,
  ...props
}: HeadingProps) {
  const Comp: HeadingTag = as ?? (level === "display" || level == null ? "h1" : `h${level}`);

  return (
    <Comp
      data-slot="heading"
      data-level={level}
      className={cn(headingVariants({ level, tone }), className)}
      {...props}
    >
      {eyebrow ? (
        <span
          data-slot="eyebrow"
          className="mb-5 flex items-center gap-3 font-sans text-xs font-medium tracking-[0.18em] text-accent-strong uppercase before:h-px before:w-10 before:shrink-0 before:bg-accent-border/70"
        >
          {eyebrow}
        </span>
      ) : null}
      {children}
    </Comp>
  );
}

export { Heading, headingVariants };
