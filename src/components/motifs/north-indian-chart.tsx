import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * North Indian kundli layout: a square with both diagonals and an inscribed
 * diamond joining the side midpoints, giving the twelve fixed houses.
 * Pure line-art, `currentColor`, no fills.
 */
export function NorthIndianChart({
  title = "North Indian birth chart layout",
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
      {/* diagonals */}
      <path d="M1 1 L199 199 M199 1 L1 199" />
      {/* inscribed diamond */}
      <path d="M100 1 L199 100 L100 199 L1 100 Z" />
    </svg>
  );
}
