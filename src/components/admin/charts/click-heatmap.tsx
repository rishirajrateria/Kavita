"use client";

/**
 * Click heatmap overlay: the aggregated viewport grid (`cols` × `rows`, row-major counts) painted
 * as a gold density layer over a same-origin `<iframe>` of the live page, with a show/hide
 * toggle and an opacity slider. The only client island in Behaviour; the grid arrives as props.
 */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "./tokens";

export interface ClickHeatmapProps {
  /** Site-relative path rendered in the iframe. */
  path: string;
  cols: number;
  rows: number;
  /** Row-major click counts, length `cols * rows`. */
  cells: number[];
  totalClicks: number;
  /** Pixel height of the viewer (the iframe scrolls inside it). */
  height?: number;
}

export function ClickHeatmap({
  path,
  cols,
  rows,
  cells,
  totalClicks,
  height = 720,
}: ClickHeatmapProps) {
  const [visible, setVisible] = React.useState(true);
  const [opacity, setOpacity] = React.useState(0.7);
  const max = Math.max(1, ...cells);
  const hot: { r: number; c: number; v: number }[] = [];
  cells.forEach((v, i) => {
    if (v > 0) hot.push({ r: Math.floor(i / cols), c: i % cols, v });
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide overlay" : "Show overlay"}
        </Button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Overlay opacity
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="accent-[var(--cta)]"
          />
        </label>
        <span className="text-xs text-muted-foreground">
          {formatNumber(totalClicks)} clicks on {path} · grid {cols} × {rows}
        </span>
      </div>
      <div
        className="relative overflow-hidden rounded-xl border border-accent-border/40 bg-card shadow-xs"
        style={{ height }}
      >
        <iframe
          src={path}
          title={`Preview of ${path}`}
          className="h-full w-full bg-background"
          loading="lazy"
        />
        {visible ? (
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${cols} ${rows}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ opacity }}
          >
            {hot.map(({ r, c, v }) => (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="var(--cta)"
                fillOpacity={0.15 + (v / max) * 0.85}
              />
            ))}
          </svg>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Each cell is a share of the viewport ({(100 / cols).toFixed(1)}% wide ×{" "}
        {(100 / rows).toFixed(1)}% tall), so the overlay lines up with the page as visitors saw it,
        whatever their screen size. Darker gold = more clicks.
      </p>
    </div>
  );
}
