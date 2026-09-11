/**
 * Stat tile: label · value (sans, proportional figures) · signed delta vs the previous period
 * (colour = direction × whether up is good, with an arrow so colour is never alone) · optional
 * 12-point sparkline in the de-emphasis hue with the latest point in gold.
 */
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHART_VARS, formatPercent } from "./tokens";

export interface StatTileProps {
  label: string;
  value: string;
  /** Ratio change vs the previous period (0.12 = +12%); `null` when there is no comparison. */
  delta?: number | null;
  /** Whether an increase is a good thing (false for bounce rate). */
  upIsGood?: boolean;
  compareLabel?: string;
  trend?: number[];
  className?: string;
}

export function StatTile({
  label,
  value,
  delta = null,
  upIsGood = true,
  compareLabel = "vs previous",
  trend,
  className,
}: StatTileProps) {
  const direction = delta === null || Math.abs(delta) < 0.0005 ? "flat" : delta > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") === upIsGood;
  const Icon =
    direction === "up" ? ArrowUpRightIcon : direction === "down" ? ArrowDownRightIcon : MinusIcon;

  return (
    <div
      style={CHART_VARS}
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-accent-border/40 bg-card p-5 shadow-xs",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-sans text-2xl font-semibold whitespace-nowrap text-foreground xl:text-3xl">
        {value}
      </p>
      {trend && trend.length > 1 ? <Sparkline points={trend} /> : null}
      <p
        className={cn(
          "flex items-center gap-1 truncate text-xs whitespace-nowrap",
          good === null ? "text-muted-foreground" : good ? "text-success" : "text-error",
        )}
      >
        {delta === null ? (
          <span className="text-muted-foreground">No comparison</span>
        ) : (
          <>
            <Icon className="size-3.5" aria-hidden="true" />
            <span>
              {direction === "flat"
                ? "±0%"
                : `${delta > 0 ? "+" : "−"}${formatPercent(Math.abs(delta))}`}
            </span>
            <span className="text-muted-foreground">{compareLabel}</span>
          </>
        )}
      </p>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 100;
  const h = 20;
  const max = Math.max(...points, 1);
  const x = (i: number) => (i / (points.length - 1)) * (w - 4) + 2;
  const y = (v: number) => h - 3 - (v / max) * (h - 6);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1] ?? 0;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="h-5 w-full"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--series-3)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x(points.length - 1)}
        cy={y(last)}
        r={2.5}
        fill="var(--series-1)"
        stroke="var(--chart-surface)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
