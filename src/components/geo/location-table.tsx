import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GeoTable } from "@/lib/geo/tables";
import type { Question } from "./answers";

/**
 * The page's specification table (CLAUDE.md §9.4) in the home-page comparison style: gold top
 * rule, serif column heads, first column as a row header. Rows come from `src/lib/geo/tables`.
 */
export function GeoLocationTable({
  table,
  question,
  tone = "default",
}: {
  table: GeoTable;
  question: Question;
  tone?: "default" | "muted";
}) {
  return (
    <Section id={table.id} spacing="lg" tone={tone} bordered={tone === "muted"}>
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={question} layout="split" />

        <Table
          containerClassName="rounded-xl border border-t-2 border-t-accent-border bg-background shadow-sm"
          className="text-base"
        >
          <TableCaption className="px-4 pb-4 text-left">{table.caption}</TableCaption>
          <TableHeader>
            <TableRow className="border-b-2 hover:bg-transparent">
              {table.columns.map((col, i) => (
                <TableHead
                  key={col}
                  scope="col"
                  className={
                    i === 0
                      ? "h-auto w-[22%] px-5 py-5 font-serif text-lg font-medium whitespace-normal text-foreground"
                      : "h-auto px-5 py-5 font-serif text-lg font-medium whitespace-normal text-foreground"
                  }
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={row[0]} className="even:bg-surface-muted/40 hover:bg-transparent">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th
                      key={i}
                      scope="row"
                      className="px-5 py-4 text-left align-top text-sm font-medium text-foreground"
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
      </Container>
    </Section>
  );
}
