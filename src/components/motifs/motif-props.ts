import type * as React from "react";

/** Shared props for the line-art motifs. */
export interface MotifProps extends Omit<React.ComponentProps<"svg">, "children" | "role"> {
  /** Accessible name. Each motif ships a sensible default. */
  title?: string;
  /** Longer accessible description (rendered as <desc>). */
  description?: string;
  /**
   * Purely decorative usage — hides the graphic from assistive tech
   * (`aria-hidden`) instead of labelling it. Default false.
   */
  decorative?: boolean;
  /** Stroke width in viewBox units. Default 1. Keep within 1–1.25. */
  strokeWidth?: number;
}

export function a11yAttrs(
  decorative: boolean,
  titleId: string,
  descId: string | undefined,
): Pick<React.ComponentProps<"svg">, "role" | "aria-hidden" | "aria-labelledby" | "focusable"> {
  if (decorative) {
    return { "aria-hidden": true, focusable: "false" };
  }
  return {
    role: "img",
    "aria-labelledby": descId ? `${titleId} ${descId}` : titleId,
    focusable: "false",
  };
}
