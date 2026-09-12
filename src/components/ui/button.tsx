import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

/*
 * Button.
 *
 * Gold is the only loud colour on the site and it belongs here, on exactly one action per view:
 * `variant="gold"` is the gradient vermilion CTA — the one loud element on a page. (The name is
 * kept because every call site uses it; the colour is a token, not the variant name.) Everything
 * else is quieter by design — `gold-outline` is the hairline second action, `outline` is a
 * frosted pane that lets the wash
 * sky through instead of punching an opaque hole in it, and `ghost` is a link with a target.
 *
 * Lift on hover is 1px here (a button is a small object; 2px is the card's move), over
 * ~220ms with no bounce, and it is disabled under `prefers-reduced-motion`.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate] duration-(--duration-base) ease-standard outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 motion-reduce:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Brand primary — ivory fill on midnight, deep indigo fill on parchment. */
        default:
          "bg-primary text-primary-foreground shadow-xs hover:-translate-y-px hover:bg-primary-hover hover:shadow-sm",
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:-translate-y-px hover:bg-primary-hover hover:shadow-sm",
        /**
         * The gradient vermilion call to action. The gradient runs red-600 → red-700 rather
         * than starting brighter, because white on red-500 measures only 3.99:1 — at this
         * ramp the lightest point of the gradient still carries text at 5.60:1.
         */
        gold: "bg-(image:--cta-gradient) text-cta-foreground shadow-cta hover:-translate-y-px hover:bg-(image:--cta-gradient-hover) hover:shadow-cta-hover",
        /** Antique-gold hairline outline — the quieter gold action. */
        "gold-outline":
          "border border-accent-border/70 bg-transparent text-accent-strong hover:-translate-y-px hover:border-accent-border hover:bg-accent/60 hover:text-accent-foreground",
        ghost:
          "text-foreground hover:bg-accent/60 hover:text-accent-foreground [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1",
        link: "text-accent-strong underline decoration-accent-border/60 decoration-1 underline-offset-4 hover:decoration-accent-strong",
        /** Frosted pane — translucent so the sky keeps showing through the control. */
        outline:
          "border border-border/80 bg-card/25 backdrop-blur-sm hover:-translate-y-px hover:border-accent-border/70 hover:bg-accent/50 hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:-translate-y-px hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        /** Hero / final CTA: 48px tall, comfortably above the 44px tap-target floor. */
        xl: "h-12 rounded-xl px-7 text-base has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11",
      },
    },
    compoundVariants: [
      // A link is text, not a control: it should never carry the control's box metrics.
      { variant: "link", size: "default", class: "h-auto px-0 py-0" },
      { variant: "link", size: "lg", class: "h-auto px-0 py-0" },
      { variant: "link", size: "xl", class: "h-auto px-0 py-0" },
      { variant: "link", size: "sm", class: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
