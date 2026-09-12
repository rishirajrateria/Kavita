import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-(--duration-base) ease-standard focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary/70 text-secondary-foreground [a&]:hover:bg-secondary",
        destructive:
          "bg-destructive text-destructive-foreground focus-visible:ring-destructive/30 [a&]:hover:bg-destructive/90",
        outline:
          "border-border/80 text-muted-foreground [a&]:hover:border-accent-border/70 [a&]:hover:text-accent-strong",
        ghost: "text-muted-foreground [a&]:hover:text-accent-strong",
        link: "text-accent-strong underline-offset-4 [a&]:hover:underline",
        /** The gold hairline pill — the site's default badge in practice. */
        gold: "border-accent-border/60 bg-transparent text-accent-strong [a&]:hover:border-accent-border [a&]:hover:bg-accent/50",
        /** Small-caps label used for service lead types and section eyebrows. */
        caps: "border-accent-border/40 bg-accent/50 px-3 py-1 text-[0.66rem] font-medium tracking-[0.16em] text-accent-foreground uppercase",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
