import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * A form is a tool, not a shrine: the field is a legible 44px-tall box with a real boundary and
 * a gold focus ring, not a frosted pane you have to squint through. The fill is a low-opacity
 * `bg-card` so the field still sits ON the night rather than punching a hole in it, while the
 * text keeps full contrast against it.
 */
const fieldClassName =
  "w-full min-w-0 rounded-lg border border-input bg-card/40 px-3.5 py-2 text-base transition-[color,background-color,border-color,box-shadow] duration-(--duration-base) ease-standard outline-none selection:bg-accent selection:text-accent-foreground placeholder:text-muted-foreground hover:border-accent-border/50 focus-visible:border-ring focus-visible:bg-card/70 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/25";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClassName,
        "h-11 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export { Input, fieldClassName };
