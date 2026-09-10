import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-gutter", {
  variants: {
    size: {
      prose: "max-w-prose",
      narrow: "max-w-narrow",
      default: "max-w-content",
      wide: "max-w-wide",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface ContainerProps
  extends React.ComponentProps<"div">, VariantProps<typeof containerVariants> {
  /** Element to render (defaults to div). */
  as?: "div" | "section" | "article" | "header" | "footer" | "nav" | "main" | "aside";
}

/** Horizontal width constraint with the fluid page gutter. */
function Container({ className, size = "default", as: Comp = "div", ...props }: ContainerProps) {
  return (
    <Comp
      data-slot="container"
      data-size={size}
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  );
}

export { Container, containerVariants };
