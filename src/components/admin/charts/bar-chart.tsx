/**
 * Horizontal bar chart for breakdowns (countries, pages, referrers …). One series, one colour
 * (gold); bars ≤ 20px thick with a rounded data-end and a square baseline; the value sits at
 * the tip; each bar carries a native `<title>` tooltip and the whole row is the hit target.
 */
import { ChartFrame } from "./chart-frame";
import { CHART_FONT, formatCompact, formatNumber, niceTicks } from "./tokens";

export interface BarDatum {
  label: string;
  value: number;
  /** Secondary text in the tooltip and data table (e.g. "42% of visitors"). */
  hint?: string;
}

export interface BarChartProps {
  title: string;
  description: string;
  data: BarDatum[];
  /** Unit for the axis and table header, e.g. "Visitors". */
  unit: string;
  maxBars?: number;
  emptyText?: string;
  className?: string;
}

const WIDTH = 640;
const ROW = 30;
const BAR = 18;
const LABEL_W = 180;
const PAD_R = 64;

export function BarChart({
  title,
  description,
  data,
  unit,
  maxBars = 10,
  emptyText = "No data in this range.",
  className,
}: BarChartProps) {
  const rows = data.slice(0, maxBars);
  const max = Math.max(0, ...rows.map((d) => d.value));
  const ticks = niceTicks(max, 4);
  const top = ticks[ticks.length - 1] ?? 1;
  const plotW = WIDTH - LABEL_W - PAD_R;
  const height = rows.length * ROW + 28;
  const x = (v: number) => LABEL_W + (v / top) * plotW;

  return (
    <ChartFrame
      title={title}
      description={description}
      viewBox={{ width: WIDTH, height: Math.max(height, 60) }}
      table={{
        columns: ["Label", unit, ...(rows.some((r) => r.hint) ? ["Note"] : [])],
        rows: rows.map((r) => [r.label, formatNumber(r.value), ...(r.hint ? [r.hint] : [])]),
      }}
      empty={rows.length === 0 ? emptyText : null}
      className={className}
    >
      <g fontFamily={CHART_FONT} fontSize={11}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={0}
              y2={rows.length * ROW}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text x={x(t)} y={rows.length * ROW + 16} textAnchor="middle" fill="var(--chart-axis)">
              {formatCompact(t)}
            </text>
          </g>
        ))}
        <text
          x={WIDTH - PAD_R}
          y={rows.length * ROW + 16}
          textAnchor="end"
          fill="var(--chart-axis)"
          fontSize={10}
          dx={PAD_R - 4}
        >
          {unit}
        </text>
        {rows.map((d, i) => {
          const y = i * ROW + (ROW - BAR) / 2;
          const w = Math.max(0, x(d.value) - LABEL_W);
          const r = Math.min(4, w / 2);
          return (
            <g key={d.label} className="group">
              <title>{`${d.label}: ${formatNumber(d.value)} ${unit.toLowerCase()}${d.hint ? ` — ${d.hint}` : ""}`}</title>
              <rect
                x={0}
                y={i * ROW}
                width={WIDTH}
                height={ROW}
                fill="transparent"
                className="group-hover:fill-muted/60"
              />
              <text
                x={LABEL_W - 10}
                y={y + BAR / 2}
                dominantBaseline="middle"
                textAnchor="end"
                fill="var(--foreground)"
              >
                {truncate(d.label, 26)}
              </text>
              <path
                d={`M${LABEL_W},${y} h${Math.max(0, w - r)} a${r},${r} 0 0 1 ${r},${r} v${BAR - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${Math.max(0, w - r)} z`}
                fill="var(--series-1)"
              />
              <text
                x={LABEL_W + w + 6}
                y={y + BAR / 2}
                dominantBaseline="middle"
                fill="var(--foreground)"
                fontVariant="tabular-nums"
              >
                {formatCompact(d.value)}
              </text>
            </g>
          );
        })}
      </g>
    </ChartFrame>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
