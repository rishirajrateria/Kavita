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
    /*
     * Tones are TRANSLUCENT, not opaque. The whole site sits on one continuous <Sky /> (root
     * layout), and an opaque band would paint over it — the rhythm now comes from panes of
     * differing density over the same night, which is also what gives the glass panels
     * something to refract. `default` deliberately adds no fill at all.
     */
    tone: {
      default: "text-foreground",
      muted: "bg-surface-muted/60 text-foreground backdrop-blur-[2px]",
      gold: "bg-surface-gold/55 text-foreground backdrop-blur-[2px]",
      /** Deeper pane. `data-tone="inverse"` re-points every semantic token (globals.css). */
      /*
       * Near-opaque, and painted from `--background` rather than `--surface-inverse`:
       * `data-depth="deep"` works by re-pointing `--background`, so naming the surface
       * token directly silently broke the deep variant. At 55% a 92%-indigo veil over
       * parchment composited to mid-grey and ivory body text fell to 2.12:1 — an AA
       * failure. At 92% the band is genuinely deep in both themes (7.33:1 muted) and
       * glass inside it still refracts, because backdrop-filter blurs what is behind it.
       */
      inverse: "bg-background/92 text-foreground",
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
