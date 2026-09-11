import { QuestionHeading } from "@/components/home/question-heading";
import { NorthIndianChart, Ornament, VastuCompass } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { CHART_STYLE_LABEL } from "@/lib/geo/tables";
import type { Question } from "./answers";

/**
 * The combined method angled to this place (CLAUDE.md §1): two instrument panels — what the
 * chart reads for a client here, what the home's plan reads for this housing — and one line on
 * how they meet. On state pages this sits on parchment; on city pages on deep indigo.
 */
export function GeoCombinedMethod({
  loc,
  service,
  question,
  tone,
}: {
  loc: LocationRecord;
  service: GeoService;
  question: Question;
  tone: "inverse" | "muted";
}) {
  const r = loc.research;
  if (!r) return null;
  const chart = CHART_STYLE_LABEL[r.tradition.chartStyle];
  const first = service === "astrologer" ? "chart" : "home";

  const panels = {
    chart: {
      heading: `The chart, for someone from ${loc.name}`,
      motif: <NorthIndianChart decorative strokeWidth={0.75} />,
      points: [
        `Cast from the date, exact time and place of birth and drawn as a ${chart}.`,
        "Read for the current dasha — the planetary period that says which themes are active now — and this year's transits.",
        `Answers what is unfolding for the client and when, before anything in the ${loc.name} home is looked at.`,
      ],
    },
    home: {
      heading: `The home, as it stands in ${loc.name}`,
      motif: <VastuCompass decorative hideLabels description="" strokeWidth={0.75} />,
      points: [
        `Read from a floor plan with north marked and a compass reading at the entrance, for ${r.climateArchitecture.housingStock}.`,
        "Assessed for which direction and room governs the life area the chart has flagged, and whether the brahmasthan — the open centre — is free.",
        "Remedies are room use, sleeping direction, colour and storage first; structural change only when nothing else answers.",
      ],
    },
  } as const;
  const order = first === "chart" ? (["chart", "home"] as const) : (["home", "chart"] as const);

  return (
    <Section
      spacing="lg"
      tone={tone}
      bordered={tone === "muted"}
      className={tone === "inverse" ? "grain overflow-hidden" : undefined}
    >
      <Container size="wide" className="relative space-y-12">
        <QuestionHeading block={question} layout="split" />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {order.map((key) => {
            const panel = panels[key];
            return (
              <article
                key={key}
                className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-accent-border/25 bg-card p-6 pt-28 text-card-foreground sm:p-8 sm:pt-36"
              >
                <div className="pointer-events-none absolute -top-8 -right-8 w-40 text-accent-strong/60 sm:-top-10 sm:-right-10 sm:w-52">
                  {panel.motif}
                </div>
                <Heading as="h3" level={3} tone="accent" className="max-w-[18ch]">
                  {panel.heading}
                </Heading>
                <ul className="space-y-3 border-t border-accent-border/30 pt-5 leading-relaxed text-muted-foreground">
                  {panel.points.map((point) => (
                    <li key={point.slice(0, 24)} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent-strong"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mx-auto flex max-w-prose items-start gap-4 border-t border-accent-border/40 pt-6 font-serif text-xl leading-relaxed text-accent-strong italic">
          <Ornament className="mt-1.5 size-5 shrink-0" strokeWidth={1.1} />
          <span>
            The chart tells Astrologer Kavita where to look in a {loc.name} home; the home tells her
            which chart remedies matter most right now. One diagnosis, one list.
          </span>
        </p>
      </Container>
    </Section>
  );
}
