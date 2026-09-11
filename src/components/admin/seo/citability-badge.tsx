import { citabilityBand } from "@/lib/seo/citability";
import { cn } from "@/lib/utils";

const TONE = {
  strong: "bg-success-soft text-success",
  fair: "bg-warning-soft text-warning",
  weak: "bg-error-soft text-error",
} as const;

/** Score pill: green ≥ 80, amber ≥ 50, red below. `null` = not scored (page unreachable). */
export function CitabilityBadge({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase",
          className,
        )}
      >
        Not scored
      </span>
    );
  }
  const band = citabilityBand(score);
  return (
    <span
      title={`Citability ${score}/100 (${band})`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase tabular-nums",
        TONE[band],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}
