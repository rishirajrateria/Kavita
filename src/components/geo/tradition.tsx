import { QuestionHeading } from "@/components/home/question-heading";
import { NorthIndianChart, SouthIndianChart } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import { CHART_STYLE_LABEL } from "@/lib/geo/tables";
import type { Question } from "./answers";
import { paragraphs } from "./opening";

const MONTH_LABEL = {
  amanta: "Amanta (month ends on the new moon)",
  purnimanta: "Purnimanta (month ends on the full moon)",
  solar: "Solar months",
  mixed: "Amanta or Purnimanta by family origin",
} as const;

/**
 * Astrology pages: the researched regional tradition — chart style, calendar, month reckoning,
 * how birth records work here — as a ruled definition list beside the 150–250 word narrative.
 * The motif matches the chart style the place actually uses.
 */
export function GeoTradition({
  loc,
  question,
  route,
  tone = "default",
}: {
  loc: LocationRecord;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  tone?: "default" | "muted";
}) {
  const t = loc.research?.tradition;
  if (!t) return null;
  const Motif = t.chartStyle === "south-indian" ? SouthIndianChart : NorthIndianChart;

  const facts: [string, string][] = [
    ["Chart style", CHART_STYLE_LABEL[t.chartStyle]],
    ["Calendar", t.calendar],
  ];
  if (t.monthReckoning) facts.push(["Month reckoning", MONTH_LABEL[t.monthReckoning]]);
  facts.push(["Birth records", t.birthRecordsNote]);

  return (
    <Section id="tradition" spacing="lg" tone={tone} className="overflow-hidden">
      <div
        aria-hidden="true"
        data-breathe
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 text-accent-strong/12 sm:w-96"
      >
        <Motif decorative strokeWidth={0.6} />
      </div>
      <Container size="wide" className="relative space-y-12">
        <QuestionHeading block={question} route={route} id="tradition" layout="split" />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <dl className="self-start">
            {facts.map(([label, value]) => (
              <div key={label} className="border-t border-accent-border/30 py-5">
                <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
                  {label}
                </dt>
                <dd className="mt-2 font-serif text-lg leading-snug sm:text-xl">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="max-w-prose space-y-6 text-lg leading-relaxed text-muted-foreground">
            {paragraphs(t.narrative).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
