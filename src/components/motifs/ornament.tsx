import { useId } from "react";
import { cn } from "@/lib/utils";
import { a11yAttrs, type MotifProps } from "./motif-props";

/**
 * Eight-point star ornament: two overlapping squares (one rotated 45°) with a dot at the
 * centre — the traditional divider mark, drawn as thin line-art in `currentColor`.
 */
export function Ornament({
  title = "Eight-point star ornament",
  description,
  decorative = true,
  strokeWidth = 1,
  className,
  ...props
}: MotifProps) {
  const titleId = useId();
  const descId = description ? `${titleId}-desc` : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className={cn("size-6", className)}
      {...a11yAttrs(decorative, titleId, descId)}
      {...props}
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      {descId ? <desc id={descId}>{description}</desc> : null}
      <path d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z" />
      <path
        d="M12 6.5 L13.5 10.5 L17.5 12 L13.5 13.5 L12 17.5 L10.5 13.5 L6.5 12 L10.5 10.5 Z"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
