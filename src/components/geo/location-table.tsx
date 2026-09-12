import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GeoTable } from "@/lib/geo/tables";
import type { Question } from "./answers";

/**
 * The page's specification table (CLAUDE.md §9.4) in the site's editorial table voice: small-caps
 * column heads over a gold hairline, the first column a serif row header, hairline row rules and
 * no fill at all — a table is type on a grid, not an object, so the night shows through it.
 * Cells wrap, so a three-column table still fits a phone. Rows come from `src/lib/geo/tables`.
 */
export function GeoLocationTable({
  table,
  question,
  route,
  tone = "default",
}: {
  table: GeoTable;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  tone?: "default" | "muted";
}) {
  return (
    <Section id={table.id} spacing="lg" tone={tone}>
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={question} route={route} id={table.id} layout="split" />

        <div>
          <Table className="text-base" aria-label={table.caption}>
            <TableHeader>
              {/* The head row's gold hairline comes from TableHeader; no fill, no box. */}
              <TableRow className="hover:bg-transparent">
                {table.columns.map((col, i) => (
                  <TableHead key={col} scope="col" className={i === 0 ? "w-[22%]" : undefined}>
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
      </Container>
    </Section>
  );
}
