/**
 * Time-series line chart. Primary series in gold (2px, round joins, end marker); an optional
 * comparison series (the previous period) in indigo; hairline solid gridlines; clean y ticks;
 * date labels thinned to fit. Each point has an oversized invisible hit circle with a `<title>`
 * tooltip, so hover works without JavaScript.
 */
import { ChartFrame } from "./chart-frame";
import { CHART_FONT, formatAxisDate, formatCompact, formatNumber, niceTicks } from "./tokens";

export interface LinePoint {
  /** Axis key, e.g. `2026-09-11` or `2026-W36` — shown through `formatAxisDate`. */
  x: string;
  y: number;
}

export interface LineSeries {
  name: string;
  points: LinePoint[];
}

export interface LineChartProps {
  title: string;
  description: string;
  /** First series is primary (gold); a second is the comparison (indigo). Max 4. */
  series: LineSeries[];
  unit: string;
  height?: number;
  emptyText?: string;
  className?: string;
  /** Format for values in tooltips/table (defaults to a whole number). */
  format?: (v: number) => string;
}

const WIDTH = 720;
const PAD = { top: 26, right: 20, bottom: 30, left: 48 };

export function LineChart({
  title,
  description,
  series,
  unit,
  height = 240,
  emptyText = "No data in this range.",
  className,
  format = formatNumber,
}: LineChartProps) {
  const shown = series.slice(0, 4).filter((s) => s.points.length > 0);
  const primary = shown[0];
  const n = primary?.points.length ?? 0;
  const max = Math.max(0, ...shown.flatMap((s) => s.points.map((p) => p.y)));
  const ticks = niceTicks(max, 4);
  const top = ticks[ticks.length - 1] ?? 1;
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  const columns = ["Period", ...shown.map((s) => `${s.name} (${unit})`)];
  const rows = (primary?.points ?? []).map((p, i) => [
    p.x,
    ...shown.map((s) => format(s.points[i]?.y ?? 0)),
  ]);

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={shown.map((s) => s.name)}
      viewBox={{ width: WIDTH, height }}
      table={{ columns, rows }}
      empty={n === 0 ? emptyText : null}
      className={className}
    >
      <g fontFamily={CHART_FONT} fontSize={11}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
              dominantBaseline="middle"
              textAnchor="end"
              fill="var(--chart-axis)"
            >
              {formatCompact(t)}
            </text>
          </g>
        ))}
        <text x={PAD.left - 8} y={10} textAnchor="end" fill="var(--chart-axis)" fontSize={10}>
          {unit}
        </text>
        {primary?.points.map((p, i) =>
          i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= labelEvery / 2) ? (
            <text
              key={p.x}
              x={x(i)}
              y={height - 8}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fill="var(--chart-axis)"
            >
              {formatAxisDate(p.x)}
            </text>
          ) : null,
        )}
        {[...shown].reverse().map((s, ri) => {
          const si = shown.length - 1 - ri;
          const colour = `var(--series-${si + 1})`;
          const d = s.points
            .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`)
            .join(" ");
          const last = s.points[s.points.length - 1];
          return (
            <g key={s.name}>
              {si === 0 ? (
                <path
                  d={`${d} L${x(s.points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`}
                  fill={colour}
                  opacity={0.1}
                />
              ) : null}
              <path
                d={d}
                fill="none"
                stroke={colour}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={si === 1 ? "4 4" : undefined}
              />
              {last ? (
                <circle
                  cx={x(s.points.length - 1)}
                  cy={y(last.y)}
                  r={4}
                  fill={colour}
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                />
              ) : null}
            </g>
          );
        })}
        {primary?.points.map((p, i) => (
          <g key={`hit-${p.x}`} className="group">
            <title>
              {[
                formatAxisDate(p.x),
                ...shown.map((s) => `${s.name}: ${format(s.points[i]?.y ?? 0)}`),
              ].join(" · ")}
            </title>
            <rect
              x={x(i) - (n > 1 ? plotW / (n - 1) / 2 : plotW / 2)}
              y={PAD.top}
              width={n > 1 ? plotW / (n - 1) : plotW}
              height={plotH}
              fill="transparent"
            />
            <line
              x1={x(i)}
              x2={x(i)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--chart-axis)"
              strokeWidth={1}
              className="opacity-0 group-hover:opacity-60"
            />
            <circle
              cx={x(i)}
              cy={y(p.y)}
              r={4}
              fill="var(--series-1)"
              stroke="var(--chart-surface)"
              strokeWidth={2}
              className="opacity-0 group-hover:opacity-100"
            />
          </g>
        ))}
      </g>
    </ChartFrame>
  );
}
