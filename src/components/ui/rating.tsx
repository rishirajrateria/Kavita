import * as React from "react";
import { cn } from "@/lib/utils";

export interface RatingProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Rating value; halves are supported (e.g. 3.5). Clamped to [0, max]. */
  value: number;
  /** Number of stars (default 5). */
  max?: number;
  /** Visual size of each star. */
  size?: "sm" | "md" | "lg";
  /** Override the accessible label. Defaults to "{value} out of {max} stars". */
  label?: string;
  /** Show the numeric value next to the stars. */
  showValue?: boolean;
}

const SIZE: Record<NonNullable<RatingProps["size"]>, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const STAR_PATH =
  "M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3l-6 3.3 1.3-6.6L2.4 9.4l6.7-.8L12 2.5z";

function Star({ fill, className }: { fill: 0 | 0.5 | 1; className: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {fill === 0.5 ? (
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      ) : null}
      <path
        d={STAR_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {fill === 1 ? <path d={STAR_PATH} fill="currentColor" /> : null}
      {fill === 0.5 ? <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${id})`} /> : null}
    </svg>
  );
}

/**
 * Display-only star rating. Renders exactly the value it is given — it never
 * invents or aggregates anything. Feed it real, attributable ratings only.
 */
function Rating({
  value,
  max = 5,
  size = "md",
  label,
  showValue = false,
  className,
  ...props
}: RatingProps) {
  const safeMax = Math.max(1, Math.floor(max));
  const clamped = Math.min(safeMax, Math.max(0, value));
  const rounded = Math.round(clamped * 2) / 2;
  const accessible = label ?? `${rounded} out of ${safeMax} stars`;

  return (
    <div
      data-slot="rating"
      role="img"
      aria-label={accessible}
      className={cn("inline-flex items-center gap-1 text-accent-strong", className)}
      {...props}
    >
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: safeMax }, (_, i) => {
          const fill: 0 | 0.5 | 1 = rounded >= i + 1 ? 1 : rounded >= i + 0.5 ? 0.5 : 0;
          return <Star key={i} fill={fill} className={SIZE[size]} />;
        })}
      </span>
      {showValue ? (
        <span className="ml-1 text-sm font-medium text-foreground tabular-nums">
          {rounded}/{safeMax}
        </span>
      ) : null}
    </div>
  );
}

export { Rating };
