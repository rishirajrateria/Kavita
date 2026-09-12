import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheckIcon, CircleXIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const calloutVariants = cva(
  "relative flex gap-3.5 rounded-xl border px-4 py-3.5 text-sm leading-relaxed [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "border-info/25 bg-info-soft text-foreground [&_svg]:text-info",
        warn: "border-warning/25 bg-warning-soft text-foreground [&_svg]:text-warning",
        success: "border-success/25 bg-success-soft text-foreground [&_svg]:text-success",
        error: "border-error/25 bg-error-soft text-foreground [&_svg]:text-error",
        /** Not a status: a quiet aside in the brand's own gold, for context and caveats. */
        note: "border-accent-border/30 bg-accent/35 text-foreground [&_svg]:text-accent-strong",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

const ICONS = {
  info: InfoIcon,
  warn: TriangleAlertIcon,
  success: CircleCheckIcon,
  error: CircleXIcon,
  note: InfoIcon,
} as const;

export interface CalloutProps
  extends Omit<React.ComponentProps<"div">, "title">, VariantProps<typeof calloutVariants> {
  /** Optional bold first line. */
  title?: React.ReactNode;
  /** Hide the leading icon. */
  hideIcon?: boolean;
}

/** Inline notice. Errors announce as alerts; the rest are polite notes. */
function Callout({
  className,
  variant = "info",
  title,
  hideIcon = false,
  children,
  role,
  ...props
}: CalloutProps) {
  const resolved = variant ?? "info";
  const Icon = ICONS[resolved];

  return (
    <div
      data-slot="callout"
      data-variant={resolved}
      role={role ?? (resolved === "error" ? "alert" : "note")}
      className={cn(calloutVariants({ variant: resolved }), className)}
      {...props}
    >
      {hideIcon ? null : <Icon aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        {title ? <p className="mb-1 font-semibold text-foreground">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

export { Callout, calloutVariants };
