import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface SpecTableData {
  readonly caption: string;
  /** An empty first column header makes the first cell of each row a `<th scope="row">`. */
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/**
 * Specification / comparison table (CLAUDE.md §9.4) in the site's editorial table voice:
 * small-caps column heads over a gold hairline, the first column a serif row header, hairline
 * row rules and no fill, no box and no shadow — a table is type on a grid, not an object.
 * Plain server HTML; cells wrap, and a table too wide to fit scrolls inside its own container,
 * never the page. Every `<td>` carries `data-label`; a table of more than three columns (or any
 * table passed `stack`) takes `.plate-stack` and stacks its rows on a phone (src/styles/scene.css).
 */
export function SpecTable({
  table,
  firstColumnWidth = "22%",
  stack = table.columns.length > 3,
}: {
  table: SpecTableData;
  firstColumnWidth?: string;
  /** Stack rows on a phone, each cell under its head. Defaults to on for more than three columns. */
  stack?: boolean;
}) {
  const [corner, ...rest] = table.columns;
  return (
    <div>
      <Table className={cn("text-base", stack && "plate-stack")} aria-label={table.caption}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" style={{ width: firstColumnWidth }}>
              {corner ? corner : <span className="sr-only">Aspect</span>}
            </TableHead>
            {rest.map((col) => (
              <TableHead key={col} scope="col">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row) => (
            <TableRow key={row[0]}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="py-3.5 pr-6 text-left align-top font-serif text-lg leading-snug font-normal text-foreground"
                  >
                    {cell}
                  </th>
                ) : (
                  <TableCell key={i} className="py-3.5" data-label={table.columns[i] ?? ""}>
                    {cell}
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Outside the scroll container: a wide table scrolls sideways and would carry its own
          <caption> off-screen with it on a phone. */}
      <p className="mt-4 font-sans text-sm text-muted-foreground">{table.caption}</p>
    </div>
  );
}
