import * as React from "react";
import { cn } from "@/lib/utils";
import { SpecTable, type SpecTableData } from "./spec-table";

export interface LedgerProps {
  /** Table data for `SpecTable`, or a ready table element (e.g. `ServicesComparisonTable`). */
  table: SpecTableData | React.ReactNode;
  /** Summary line; defaults to `Table · {first clause of the caption}`. */
  summary?: string;
  /** Open for the page's primary table — the first one, or the one its H2 is about. */
  open?: boolean;
  /** Stack the rows on a phone (`SpecTable` data only); on by default for more than three columns. */
  stack?: boolean;
  className?: string;
}

function isTableData(table: LedgerProps["table"]): table is SpecTableData {
  return (
    typeof table === "object" &&
    table !== null &&
    !React.isValidElement(table) &&
    "columns" in table &&
    "rows" in table
  );
}

/**
 * A table folded under its plate: `<details class="ledger">` whose summary is a Cinzel line and
 * whose body is the table unchanged (SPEC §2.3). The table is in the HTML whether open or
 * closed; it scrolls inside its own container, and its caption stays outside the scroll.
 */
export function Ledger({ table, summary, open = false, stack, className }: LedgerProps) {
  const data = isTableData(table) ? table : undefined;
  const label =
    summary ??
    (data ? `Table · ${data.caption.split(/[.;:—]/)[0]?.trim() ?? data.caption}` : "Table");

  return (
    <details className={cn("ledger", className)} open={open}>
      <summary className="flex min-h-11 cursor-pointer items-center gap-3 font-display text-[0.68rem] font-semibold tracking-[0.22em] text-accent-strong uppercase [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="faq-marker inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-accent-border/50 font-serif text-lg leading-none text-accent-strong"
        >
          +
        </span>
        {label}
      </summary>
      <div className="mt-5">
        {data ? <SpecTable table={data} stack={stack} /> : (table as React.ReactNode)}
      </div>
    </details>
  );
}
