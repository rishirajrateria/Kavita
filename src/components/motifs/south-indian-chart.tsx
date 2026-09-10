import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * South Indian chart layout: a 4×4 grid whose centre 2×2 block is left empty,
 * leaving twelve cells around the border for the fixed rashis (signs).
 */
export function SouthIndianChart({
  title = "South Indian birth chart layout",
  description,
  decorative = false,
  strokeWidth = 1,
  className,
  ...props
}: MotifProps) {
  const titleId = useId();
  const descId = description ? `${titleId}-desc` : undefined;

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={cn("size-full", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...props}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{description}</desc> : null}
      {/* outer square */}
      <rect x="1" y="1" width="198" height="198" />
      {/* inner square bounding the empty centre */}
      <rect x="50.5" y="50.5" width="99" height="99" />
      {/* column dividers — full height at 1/4 and 3/4, only in the border band at 1/2 */}
      <path d="M50.5 1 V199 M149.5 1 V199 M100 1 V50.5 M100 149.5 V199" />
      {/* row dividers */}
      <path d="M1 50.5 H199 M1 149.5 H199 M1 100 H50.5 M149.5 100 H199" />
    </svg>
  );
}
