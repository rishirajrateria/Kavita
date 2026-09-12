import { useId } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SpecTableData {
  readonly caption: string;
  /** An empty first column header makes the first cell of each row a `<th scope="row">`. */
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/**
 * Specification / comparison table in the home-page style (CLAUDE.md §9.4): a gold top rule,
 * serif column heads, zebra rows, first column as a row header. Deliberately unfilled — a table
 * is type on a grid, not an object. Plain server HTML; wide tables scroll sideways inside their
 * own container, never the page.
 */
export function SpecTable({
  table,
  firstColumnWidth = "22%",
}: {
  table: SpecTableData;
  firstColumnWidth?: string;
}) {
  const [corner, ...rest] = table.columns;
  const captionId = useId();
  return (
    <div className="rounded-2xl border border-t-2 border-border/70 border-t-accent-border/80">
      <Table className="text-base" aria-describedby={captionId}>
        <TableHeader>
          <TableRow className="border-b-2 hover:bg-transparent">
            <TableHead
              scope="col"
              style={{ width: firstColumnWidth }}
              className="h-auto px-5 py-5 font-serif text-lg font-medium whitespace-normal text-foreground"
            >
              {corner ? corner : <span className="sr-only">Aspect</span>}
            </TableHead>
            {rest.map((col) => (
              <TableHead
                key={col}
                scope="col"
                className="h-auto px-5 py-5 font-serif text-lg font-medium whitespace-normal text-foreground"
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row) => (
            <TableRow key={row[0]} className="even:bg-accent/20 hover:bg-transparent">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="min-w-[10rem] px-5 py-4 text-left align-top text-sm font-medium text-foreground"
                  >
                    {cell}
                  </th>
                ) : (
                  <TableCell
                    key={i}
                    className="min-w-[12rem] px-5 py-4 align-top leading-relaxed whitespace-normal"
                  >
                    {cell}
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Outside the scroll container so it never clips on narrow screens. */}
      <p
        id={captionId}
        className="border-t border-border/70 px-5 py-4 text-sm text-muted-foreground"
      >
        {table.caption}
      </p>
    </div>
  );
}
