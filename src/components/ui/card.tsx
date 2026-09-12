import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Card — the site's one panel primitive.
 *
 * Everything in the midnight direction sits on a single continuous <Sky />, so a card is not a
 * white rectangle on a page: it is either a *region* (a hairline and some air, letting the night
 * show through) or an *object* (a frosted plate that lifts off the sky). Those are the two
 * variants that matter, and the distinction is the whole reason glass stays rare:
 *
 *   quiet  — default. No fill. A hairline, generous padding, nothing else. Use for grid items,
 *            list rows, anything that appears three or more times in a section.
 *   glass  — the `.glass` plate from globals.css. Reserved for the one or two things per
 *            section that should genuinely lift: a key-facts slab, a featured service, a pull
 *            quote. A page of glass rectangles is as flat as a page of white ones.
 *   solid  — `bg-card`, opaque. Only when something must be readable over an image or a motif.
 *   gold   — an accent-tinted pane for a callout that is not an alert.
 *
 * The card owns its own padding (the shadcn slots below are layout only), so a consumer can
 * wrap arbitrary content in <Card> and get the right inset without remembering px-6.
 */
const cardVariants = cva(
  "relative flex flex-col rounded-2xl text-card-foreground [--card-gap:1.25rem]",
  {
    variants: {
      variant: {
        quiet: "border border-border/70",
        glass: "glass",
        solid: "border border-border/70 bg-card shadow-sm",
        gold: "border border-accent-border/35 bg-accent/40",
        bare: "",
      },
      padding: {
        none: "",
        sm: "p-4 sm:p-5",
        default: "p-6 sm:p-7",
        lg: "p-7 sm:p-9",
      },
      /**
       * Hover micro-interaction for a card that is itself a link or button: a 2px lift and a
       * gold hairline over ~360ms, no bounce, and no movement under reduced motion.
       */
      interactive: {
        true: "transition-[border-color,box-shadow,translate,background-color] duration-(--duration-slow) ease-standard hover:-translate-y-0.5 hover:border-accent-border/70 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:hover:translate-y-0",
        false: "",
      },
    },
    compoundVariants: [
      // `.glass` already carries its own edge; on hover warm that edge to gold rather than
      // stacking a second border on top of it.
      { variant: "glass", interactive: true, class: "hover:border-accent-border/60" },
    ],
    defaultVariants: {
      variant: "quiet",
      padding: "default",
      interactive: false,
    },
  },
);

export interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

function Card({ className, variant, padding, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant ?? "quiet"}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  );
}

/** Title + description block. Pure layout — the Card supplies the inset. */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-5",
        className,
      )}
      {...props}
    />
  );
}

/** Serif, medium weight, tight tracking — the same voice as the page headings. */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-serif text-xl leading-snug font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("mt-(--card-gap) first:mt-0 empty:mt-0", className)}
      {...props}
    />
  );
}

/** Footer sits below a gold hairline when `border-t` is applied by the consumer. */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-(--card-gap) flex items-center gap-3 first:mt-0 [.border-t]:border-accent-border/25 [.border-t]:pt-5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
