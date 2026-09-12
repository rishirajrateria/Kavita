import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * A rule does more work in this direction than a border does, so it is worth the primitive:
 * `tone="gold"` is the antique-gold hairline that separates without drawing a box, and
 * `tone="fade"` is the same hairline dissolving at both ends, for the end of a section.
 *
 * Deliberately NOT the Radix primitive: a horizontal line needs no JavaScript, and every
 * `"use client"` removed from `src/components/ui` is client JS a page stops paying for.
 * `role="separator"` + `aria-orientation` is exactly what Radix emits anyway.
 */
const separatorVariants = cva("shrink-0 border-0", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px self-stretch",
    },
    tone: {
      default: "bg-border",
      gold: "bg-accent-border/45",
      fade: "bg-transparent",
    },
  },
  compoundVariants: [
    {
      orientation: "horizontal",
      tone: "fade",
      class:
        "bg-[linear-gradient(to_right,transparent,var(--accent-border)_18%,var(--accent-border)_82%,transparent)] opacity-45",
    },
    {
      orientation: "vertical",
      tone: "fade",
      class:
        "bg-[linear-gradient(to_bottom,transparent,var(--accent-border)_18%,var(--accent-border)_82%,transparent)] opacity-45",
    },
  ],
  defaultVariants: { orientation: "horizontal", tone: "default" },
});

export interface SeparatorProps
  extends Omit<React.ComponentProps<"div">, "role">, VariantProps<typeof separatorVariants> {
  /** Purely visual (default). Set false when the rule genuinely divides two regions. */
  decorative?: boolean;
}

function Separator({
  className,
  orientation = "horizontal",
  tone = "default",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      data-orientation={orientation ?? "horizontal"}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative || orientation === "horizontal" ? undefined : "vertical"}
      className={cn(separatorVariants({ orientation, tone }), className)}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
