import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Plain `<label>`, not the Radix primitive: `htmlFor` already gives native click-to-focus, so
 * the primitive only bought double-click text-selection suppression — not worth a `"use client"`
 * boundary on a component every form on the site imports.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
