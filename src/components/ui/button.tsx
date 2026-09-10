import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate] duration-(--duration-fast) ease-standard outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Brand primary — deep indigo fill (ivory fill in dark mode). */
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        /** Solid antique gold with midnight text — the one loud call to action on a page. */
        gold: "bg-cta text-cta-foreground shadow-cta hover:-translate-y-px hover:bg-cta-hover hover:shadow-cta-hover motion-reduce:hover:translate-y-0",
        /** Antique-gold hairline outline — the quieter gold action. */
        "gold-outline":
          "border border-accent-border bg-transparent text-accent-strong hover:bg-accent hover:text-accent-foreground",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1",
        link: "text-accent-strong underline-offset-4 hover:underline",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        /** Hero / final CTA: 48px tall, comfortably above the 44px tap-target floor. */
        xl: "h-12 rounded-lg px-7 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
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
