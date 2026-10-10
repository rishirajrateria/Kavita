import type * as React from "react";
import { cn } from "@/lib/utils";

const WIDTH = { default: "52rem", wide: "72rem" } as const;

/**
 * A field of doors under a plate's answer. `FigureSection` sets its children in a 60ch reading
 * measure; a grid of tiles needs the plate's full width, so this lets the field out to 52 or
 * 72 rem, centred on the measure, while the H2 and `.answer` above it keep their column. Below
 * that width it is simply the gutter column — no horizontal overflow at 390 px.
 */
export function DoorSpread({
  children,
  width = "default",
  className,
}: {
  children: React.ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
}) {
  return (
    <div
      className={cn("relative left-1/2 -translate-x-1/2 pt-2", className)}
      style={{ width: `min(${WIDTH[width]}, calc(100vw - 2rem))` }}
    >
      {children}
    </div>
  );
}
