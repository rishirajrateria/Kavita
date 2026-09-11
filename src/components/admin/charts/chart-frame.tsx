/**
 * Shared frame for every admin chart: a `<figure>` with a visible title, an accessible SVG
 * (`role="img"` + `<title>`/`<desc>` via `aria-labelledby`), an optional legend and the
 * visually-hidden data table twin every chart ships with (WCAG-clean equivalent).
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CHART_VARS, SERIES_COLOURS, slugId } from "./tokens";

export interface ChartTableColumn {
  label: string;
}

export interface ChartFrameProps {
  title: string;
  /** One sentence for `<desc>`; also used as the figure caption when `caption` is unset. */
  description: string;
  caption?: ReactNode;
  /** Names for the legend; a single series gets no legend (the title names it). */
  legend?: string[];
  /** Data twin. */
  table: { columns: string[]; rows: (string | number)[][] };
  /** `viewBox` of the SVG; the SVG scales to its container width. */
  viewBox: { width: number; height: number };
  className?: string;
  /** Children are placed inside the `<svg>`. */
  children: ReactNode;
  /** Extra content beside/under the SVG but inside the figure (e.g. HTML labels). */
  after?: ReactNode;
  /** Empty-state text, rendered instead of the SVG when set. */
  empty?: string | null;
}

export function ChartFrame({
  title,
  description,
  caption,
  legend,
  table,
  viewBox,
  className,
  children,
  after,
  empty,
}: ChartFrameProps) {
  const titleId = slugId("chart-title", title);
  const descId = slugId("chart-desc", title);
  return (
    <figure
      style={CHART_VARS}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-accent-border/40 bg-card p-5 shadow-xs",
        className,
      )}
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-serif text-lg font-medium tracking-tight text-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{caption ?? description}</span>
      </figcaption>
      {legend && legend.length > 1 ? (
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-label="Legend"
        >
          {legend.map((name, i) => (
            <li key={name} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full"
                style={{ background: SERIES_COLOURS[i % SERIES_COLOURS.length] }}
              />
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      {empty ? (
        <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          {/* Wide charts keep a legible minimum width on phones and scroll inside the card. */}
          <svg
            role="img"
            aria-labelledby={`${titleId} ${descId}`}
            viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
            className="h-auto w-full"
            style={{
              aspectRatio: `${viewBox.width} / ${viewBox.height}`,
              minWidth: viewBox.width >= 600 ? 640 : undefined,
            }}
          >
            <title id={titleId}>{title}</title>
            <desc id={descId}>{description}</desc>
            {children}
          </svg>
        </div>
      )}
      {after}
      <table className="sr-only">
        <caption>{title} — data</caption>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
