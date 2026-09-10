import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProseProps extends React.ComponentProps<"div"> {
  /** Element to render (defaults to div). */
  as?: "div" | "article" | "section";
  /** Remove the max-width measure (e.g. inside an already-constrained column). */
  unbounded?: boolean;
}

/**
 * Long-form typography wrapper. Styles live in `.prose` in globals.css so that
 * server-rendered article HTML stays plain and crawlable.
 */
function Prose({ className, as: Comp = "div", unbounded = false, ...props }: ProseProps) {
  return (
    <Comp
      data-slot="prose"
      className={cn("prose", unbounded && "max-w-none", className)}
      {...props}
    />
  );
}

export { Prose };
