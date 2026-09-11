/**
 * Booking funnel: one bar per step (width = share of the first step), drop-off between steps
 * written in words, conversion of the whole funnel in the caption. Single series → gold; the
 * unfilled track is a lighter step of the same ramp (a meter, not a second series).
 */
import { ChartFrame } from "./chart-frame";
import { CHART_FONT, formatNumber, formatPercent } from "./tokens";

export interface FunnelStep {
  label: string;
  count: number;
}

export interface FunnelChartProps {
  title: string;
  description: string;
  steps: FunnelStep[];
  emptyText?: string;
  className?: string;
}

const WIDTH = 640;
const LABEL_W = 200;
const ROW = 44;
const BAR = 20;
const PAD_R = 120;

export function FunnelChart({
  title,
  description,
  steps,
  emptyText = "No funnel events in this range.",
  className,
}: FunnelChartProps) {
  const first = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1]?.count ?? 0;
  const plotW = WIDTH - LABEL_W - PAD_R;
  const height = steps.length * ROW;
  const conversion = first > 0 ? last / first : 0;

  return (
    <ChartFrame
      title={title}
      description={description}
      caption={first > 0 ? `${formatPercent(conversion)} of starts complete` : undefined}
      viewBox={{ width: WIDTH, height: Math.max(height, 60) }}
      table={{
        columns: ["Step", "Count", "Share of first step", "Drop-off from previous"],
        rows: steps.map((s, i) => {
          const prev = steps[i - 1]?.count ?? 0;
          return [
            s.label,
            formatNumber(s.count),
            formatPercent(first > 0 ? s.count / first : 0),
            i === 0 ? "–" : formatPercent(prev > 0 ? 1 - s.count / prev : 0),
          ];
        }),
      }}
      empty={steps.length === 0 || first === 0 ? emptyText : null}
      className={className}
    >
      <g fontFamily={CHART_FONT} fontSize={11}>
        {steps.map((s, i) => {
          const y = i * ROW + 6;
          const share = first > 0 ? s.count / first : 0;
          const w = Math.max(0, share * plotW);
          const prev = steps[i - 1]?.count ?? 0;
          const drop = i === 0 || prev === 0 ? null : 1 - s.count / prev;
          const r = Math.min(4, w / 2);
          return (
            <g key={s.label} className="group">
              <title>{`${s.label}: ${formatNumber(s.count)} (${formatPercent(share)} of starts)${drop !== null ? `, ${formatPercent(drop)} dropped since previous step` : ""}`}</title>
              <rect
                x={0}
                y={i * ROW}
                width={WIDTH}
                height={ROW}
                fill="transparent"
                className="group-hover:fill-muted/50"
              />
              <text
                x={LABEL_W - 10}
                y={y + BAR / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--foreground)"
              >
                {s.label}
              </text>
              <rect
                x={LABEL_W}
                y={y}
                width={plotW}
                height={BAR}
                rx={4}
                fill="var(--series-1)"
                opacity={0.12}
              />
              {w > 0 ? (
                <path
                  d={`M${LABEL_W},${y} h${Math.max(0, w - r)} a${r},${r} 0 0 1 ${r},${r} v${BAR - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${Math.max(0, w - r)} z`}
                  fill="var(--series-1)"
                />
              ) : null}
              <text
                x={LABEL_W + plotW + 8}
                y={y + BAR / 2}
                dominantBaseline="middle"
                fill="var(--foreground)"
                fontVariant="tabular-nums"
              >
                {formatNumber(s.count)}
                <tspan fill="var(--chart-axis)"> · {formatPercent(share, 0)}</tspan>
              </text>
              {drop !== null ? (
                <text x={LABEL_W} y={y + BAR + 12} fill="var(--chart-axis)" fontSize={10}>
                  {formatPercent(drop, 0)} drop-off from previous step
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </ChartFrame>
  );
}
