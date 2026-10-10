import { FigureSection, Ledger } from "@/components/content";
import type { GeoTable } from "@/lib/geo/tables";
import type { Question } from "./answers";
import { WIDE_BLOCK, type Plate } from "./parts";

/**
 * The page's specification table (CLAUDE.md §9.4) as a ruled plate: the question, its answer,
 * then the table on an open `Ledger` — the page's primary table, so it is open at rest and in
 * the HTML either way. A table of more than three columns stacks its rows on a phone. Rows come
 * from `src/lib/geo/tables`.
 */
export function GeoLocationTable({
  table,
  question,
  route,
  plate,
}: {
  table: GeoTable;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  plate: Plate;
}) {
  return (
    <FigureSection
      id={table.id}
      route={route}
      n={plate.n}
      tone={plate.tone}
      question={question.question}
      answer={question.answer}
      className={WIDE_BLOCK}
    >
      <Ledger table={table} open summary={`Table · ${question.eyebrow}`} />
    </FigureSection>
  );
}
