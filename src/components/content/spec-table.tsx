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
 * Specification / comparison table (CLAUDE.md §9.4) in the site's editorial table voice:
 * small-caps column heads over a gold hairline, the first column a serif row header, hairline
 * row rules and no fill, no box and no shadow — a table is type on a grid, not an object.
 * Plain server HTML; cells wrap, and a table too wide to fit scrolls inside its own container,
 * never the page.
 */
export function SpecTable({
  table,
  firstColumnWidth = "22%",
}: {
  table: SpecTableData;
  firstColumnWidth?: string;
}) {
  const [corner, ...rest] = table.columns;
  return (
    <div>
      <Table className="text-base" aria-label={table.caption}>
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
                  <TableCell key={i} className="py-3.5">
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
      <p className="mt-4 text-sm text-muted-foreground">{table.caption}</p>
    </div>
  );
}
