import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sectionVariants = cva("relative w-full", {
  variants: {
    spacing: {
      none: "",
      sm: "py-section-sm",
      md: "py-section-md",
      lg: "py-section-lg",
    },
    tone: {
      default: "bg-background text-foreground",
      muted: "bg-surface-muted text-foreground",
      gold: "bg-surface-gold text-foreground",
      /** Deep indigo band. `data-tone="inverse"` re-points every semantic token (globals.css). */
      inverse: "bg-background text-foreground",
      transparent: "",
    },
    bordered: {
      true: "border-y",
      false: "",
    },
  },
  defaultVariants: {
    spacing: "md",
    tone: "default",
    bordered: false,
  },
});

export interface SectionProps
  extends React.ComponentProps<"section">, VariantProps<typeof sectionVariants> {
  /** Element to render (defaults to section). */
  as?: "section" | "div" | "article" | "aside" | "header" | "footer";
  /** Inverse only: use the deeper indigo (footer, final CTA) instead of the default band. */
  depth?: "default" | "deep";
}

/** Full-width vertical band with consistent block spacing and surface tone. */
function Section({
  className,
  spacing = "md",
  tone = "default",
  bordered = false,
  as = "section",
  depth = "default",
  ...props
}: SectionProps) {
  // All accepted tags share HTMLElement props; typing via "section" keeps ref types consistent.
  const Comp = as as "section";
  return (
    <Comp
      data-slot="section"
      data-tone={tone}
      data-depth={tone === "inverse" && depth === "deep" ? "deep" : undefined}
      className={cn(sectionVariants({ spacing, tone, bordered }), className)}
      {...props}
    />
  );
}

export { Section, sectionVariants };
