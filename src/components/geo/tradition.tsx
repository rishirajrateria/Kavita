import { FigureSection } from "@/components/content";
import { NorthIndianChart, SouthIndianChart } from "@/components/motifs";
import type { LocationRecord } from "@/content/locations/schema";
import { CHART_STYLE_LABEL } from "@/lib/geo/tables";
import type { Question } from "./answers";
import { FactList } from "./fact-list";
import { Paragraphs, type Plate, SmallFigure } from "./parts";

const MONTH_LABEL = {
  amanta: "Amanta (month ends on the new moon)",
  purnimanta: "Purnimanta (month ends on the full moon)",
  solar: "Solar months",
  mixed: "Amanta or Purnimanta by family origin",
} as const;

/**
 * Astrology pages: the researched regional tradition as a column plate — the chart drawn in the
 * style the place actually uses on the left; on the right the question, its answer, chart
 * style, calendar, month reckoning and birth records as a ruled definition list, and the
 * 150–250 word narrative. Everything visible.
 */
export function GeoTradition({
  loc,
  question,
  route,
  plate,
}: {
  loc: LocationRecord;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  plate: Plate;
}) {
  const t = loc.research?.tradition;
  if (!t) return null;
  const south = t.chartStyle === "south-indian";

  const facts: [string, string][] = [
    ["Chart style", CHART_STYLE_LABEL[t.chartStyle]],
    ["Calendar", t.calendar],
  ];
  if (t.monthReckoning) facts.push(["Month reckoning", MONTH_LABEL[t.monthReckoning]]);
  facts.push(["Birth records", t.birthRecordsNote]);

  return (
    <FigureSection
      id="tradition"
      route={route}
      n={plate.n}
      tone={plate.tone}
      layout="column"
      question={question.question}
      answer={question.answer}
      line={question.eyebrow}
      figureWidth="narrow"
      figure={
        <SmallFigure>
          {south ? (
            <SouthIndianChart strokeWidth={0.6} className="text-accent-strong" />
          ) : (
            <NorthIndianChart strokeWidth={0.6} className="text-accent-strong" />
          )}
        </SmallFigure>
      }
    >
      <FactList facts={facts} />
      <Paragraphs text={t.narrative} />
    </FigureSection>
  );
}
