/**
 * Stacked columns (≤ 4 series in fixed slot order: gold, indigo, muted, pale gold). Segments
 * are separated by a 2px surface gap rather than a stroke; the top segment has a rounded cap.
 * Legend always present; per-column `<title>` tooltip; values in the data-table twin.
 */
import { ChartFrame } from "./chart-frame";
import { CHART_FONT, formatCompact, formatNumber, niceTicks } from "./tokens";

export interface StackedSeries {
  name: string;
  values: number[];
}

export interface StackedBarChartProps {
  title: string;
  description: string;
  categories: string[];
  series: StackedSeries[];
  unit: string;
  height?: number;
  emptyText?: string;
  className?: string;
  formatCategory?: (c: string) => string;
}

const WIDTH = 720;
const PAD = { top: 20, right: 12, bottom: 30, left: 48 };
const GAP = 2;

export function StackedBarChart({
  title,
  description,
  categories,
  series,
  unit,
  height = 240,
  emptyText = "No data in this range.",
  className,
  formatCategory = (c) => c,
}: StackedBarChartProps) {
  const shown = series.slice(0, 4);
  const totals = categories.map((_, i) => shown.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const max = Math.max(0, ...totals);
  const ticks = niceTicks(max, 4);
  const top = ticks[ticks.length - 1] ?? 1;
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const slot = categories.length ? plotW / categories.length : plotW;
  const bar = Math.min(24, slot * 0.6);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.max(1, Math.ceil(categories.length / 10));

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={shown.map((s) => s.name)}
      viewBox={{ width: WIDTH, height }}
      table={{
        columns: ["Category", ...shown.map((s) => `${s.name} (${unit})`), "Total"],
        rows: categories.map((c, i) => [
          formatCategory(c),
          ...shown.map((s) => formatNumber(s.values[i] ?? 0)),
          formatNumber(totals[i] ?? 0),
        ]),
      }}
      empty={categories.length === 0 || max === 0 ? emptyText : null}
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
        {categories.map((c, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          let acc = 0;
          const segments = shown.map((s, si) => {
            const v = s.values[i] ?? 0;
            const y0 = y(acc + v);
            const y1 = y(acc);
            acc += v;
            return { si, v, y0, y1, name: s.name };
          });
          const lastIdx = segments.map((s) => s.v > 0).lastIndexOf(true);
          return (
            <g key={c} className="group">
              <title>
                {`${formatCategory(c)} — ${segments
                  .filter((s) => s.v > 0)
                  .map((s) => `${s.name}: ${formatNumber(s.v)}`)
                  .join(", ")} (total ${formatNumber(totals[i] ?? 0)})`}
              </title>
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                className="group-hover:fill-muted/50"
              />
              {segments.map((s) => {
                if (s.v <= 0) return null;
                const h = Math.max(0, s.y1 - s.y0 - (s.si === lastIdx ? 0 : GAP));
                const r = s.si === lastIdx ? Math.min(4, bar / 2, h) : 0;
                const x0 = cx - bar / 2;
                return (
                  <path
                    key={s.name}
                    d={
                      r > 0
                        ? `M${x0},${s.y1} v-${h - r} a${r},${r} 0 0 1 ${r},-${r} h${bar - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} z`
                        : `M${x0},${s.y1} v-${h} h${bar} v${h} z`
                    }
                    fill={`var(--series-${s.si + 1})`}
                  />
                );
              })}
              {i % labelEvery === 0 ? (
                <text x={cx} y={height - 8} textAnchor="middle" fill="var(--chart-axis)">
                  {formatCategory(c)}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </ChartFrame>
  );
}
