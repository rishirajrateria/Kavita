/**
 * Server-rendered data table: sortable column headers (links that flip `?sort=&dir=`), zebra
 * rows, numeric columns right-aligned with tabular figures, an honest empty state, and
 * `<TablePagination>` underneath driven by `?page=`. Sorting itself happens in the query layer;
 * this component only renders the state it is given.
 */
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildHref, type SearchParams } from "../filters/search-params";

export interface Column<Row> {
  key: string;
  label: string;
  align?: "left" | "right";
  sortable?: boolean;
  /** Cell renderer; defaults to `String(row[key])`. */
  render?: (row: Row) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  caption: string;
  pathname: string;
  current: SearchParams;
  sort?: string;
  dir?: "asc" | "desc";
  emptyText?: string;
  /** Rows that should be highlighted (e.g. zero-traffic geo pages). */
  highlight?: (row: Row) => boolean;
  className?: string;
}

export function DataTable<Row extends object>({
  columns,
  rows,
  rowKey,
  caption,
  pathname,
  current,
  sort,
  dir = "desc",
  emptyText = "Nothing to show for this range.",
  highlight,
  className,
}: DataTableProps<Row>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-accent-border/40 bg-card shadow-xs",
        className,
      )}
    >
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="bg-surface-muted/60 hover:bg-surface-muted/60">
            {columns.map((col) => {
              const active = sort === col.key;
              const nextDir = active && dir === "desc" ? "asc" : "desc";
              const Icon = dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
              return (
                <TableHead
                  key={col.key}
                  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "text-xs tracking-wide uppercase",
                    col.align === "right" && "text-right",
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    <Link
                      href={buildHref(pathname, current, {
                        sort: col.key,
                        dir: nextDir,
                        page: undefined,
                      })}
                      className={cn(
                        "inline-flex items-center gap-1 no-underline",
                        active ? "text-accent-strong" : "text-foreground/80 hover:text-foreground",
                      )}
                    >
                      {col.label}
                      {active ? <Icon className="size-3" aria-hidden="true" /> : null}
                    </Link>
                  ) : (
                    col.label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => {
              const hot = highlight?.(row) ?? false;
              return (
                <TableRow
                  key={rowKey(row, i)}
                  data-highlight={hot ? "true" : undefined}
                  className={cn(
                    i % 2 === 1 && "bg-surface-muted/40",
                    hot && "bg-warning-soft/70 hover:bg-warning-soft",
                  )}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.align === "right" && "text-right tabular-nums",
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
