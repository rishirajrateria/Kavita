/**
 * Scroll-depth heat strip: one row per page, five cells (25 / 50 / 75 / 90 / 100 %) filled with
 * a single-hue gold ramp (opacity by share of sessions reaching that depth). Cell labels are
 * visible, so colour is never the only channel; the data twin lists every percentage.
 */
import { ChartFrame } from "./chart-frame";
import { CHART_FONT, formatPercent } from "./tokens";

export const SCROLL_MARKS = [25, 50, 75, 90, 100] as const;

export interface HeatStripRow {
  label: string;
  /** Share of pageviews (0–1) reaching each of the five marks, in `SCROLL_MARKS` order. */
  reached: [number, number, number, number, number];
  pageviews?: number;
}

export interface HeatStripProps {
  title: string;
  description: string;
  rows: HeatStripRow[];
  emptyText?: string;
  className?: string;
}

const WIDTH = 640;
const LABEL_W = 220;
const ROW = 28;
const CELL_H = 22;

export function HeatStrip({
  title,
  description,
  rows,
  emptyText = "No scroll data in this range.",
  className,
}: HeatStripProps) {
  const cellW = (WIDTH - LABEL_W) / SCROLL_MARKS.length;
  const height = rows.length * ROW + 24;
  return (
    <ChartFrame
      title={title}
      description={description}
      viewBox={{ width: WIDTH, height: Math.max(height, 60) }}
      table={{
        columns: ["Page", ...SCROLL_MARKS.map((m) => `Reached ${m}%`)],
        rows: rows.map((r) => [r.label, ...r.reached.map((v) => formatPercent(v, 0))]),
      }}
      empty={rows.length === 0 ? emptyText : null}
      className={className}
    >
      <g fontFamily={CHART_FONT} fontSize={11}>
        {SCROLL_MARKS.map((m, i) => (
          <text
            key={m}
            x={LABEL_W + cellW * i + cellW / 2}
            y={12}
            textAnchor="middle"
            fill="var(--chart-axis)"
          >
            {m}%
          </text>
        ))}
        {rows.map((r, ri) => {
          const y = 20 + ri * ROW;
          return (
            <g key={r.label}>
              <text
                x={LABEL_W - 10}
                y={y + CELL_H / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--foreground)"
              >
                {r.label.length > 30 ? `${r.label.slice(0, 29)}…` : r.label}
              </text>
              {r.reached.map((v, ci) => {
                const share = Math.max(0, Math.min(1, v));
                const dark = share > 0.55;
                return (
                  <g key={ci}>
                    <title>{`${r.label}: ${formatPercent(v, 0)} reached ${SCROLL_MARKS[ci]}%`}</title>
                    <rect
                      x={LABEL_W + cellW * ci + 1}
                      y={y}
                      width={cellW - 2}
                      height={CELL_H}
                      rx={3}
                      fill="var(--series-1)"
                      opacity={0.12 + share * 0.88}
                    />
                    <text
                      x={LABEL_W + cellW * ci + cellW / 2}
                      y={y + CELL_H / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill={dark ? "var(--cta-foreground)" : "var(--foreground)"}
                    >
                      {formatPercent(v, 0)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    </ChartFrame>
  );
}
