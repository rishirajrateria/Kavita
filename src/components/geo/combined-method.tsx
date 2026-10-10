import { FigureSection } from "@/components/content";
import { Convergence } from "@/components/motifs";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { CHART_STYLE_LABEL } from "@/lib/geo/tables";
import type { Question } from "./answers";
import { CAPTION_H3, type Plate } from "./parts";

/**
 * The combined method angled to this place (CLAUDE.md §1) as a centred plate: the Convergence
 * figure — a chart and a plan carried into one point — then the question and its answer, then
 * what the chart reads for a client here and what the plan reads for this housing as two ruled
 * columns, and one Cormorant line on how they meet. Every point is visible.
 */
export function GeoCombinedMethod({
  loc,
  service,
  question,
  route,
  plate,
}: {
  loc: LocationRecord;
  service: GeoService;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  plate: Plate;
}) {
  const r = loc.research;
  if (!r) return null;
  const chart = CHART_STYLE_LABEL[r.tradition.chartStyle];

  const panels = {
    chart: {
      heading: `The chart, for someone from ${loc.name}`,
      points: [
        `Cast from the date, exact time and place of birth and drawn as a ${chart}.`,
        "Read for the current dasha — the planetary period that says which themes are active now — and this year's transits.",
        `Answers what is unfolding for the client and when, before anything in the ${loc.name} home is looked at.`,
      ],
    },
    home: {
      heading: `The home, as it stands in ${loc.name}`,
      points: [
        `Read from a floor plan with north marked and a compass reading at the entrance, for ${r.climateArchitecture.housingStock}.`,
        "Assessed for which direction and room governs the life area the chart has flagged, and whether the brahmasthan — the open centre — is free.",
        "Remedies are room use, sleeping direction, colour and storage first; structural change only when nothing else answers.",
      ],
    },
  } as const;
  const order =
    service === "astrologer" ? (["chart", "home"] as const) : (["home", "chart"] as const);

  return (
    <FigureSection
      id="combined-method"
      route={route}
      n={plate.n}
      tone={plate.tone}
      question={question.question}
      answer={question.answer}
      line={question.eyebrow}
      figureWidth="wide"
      figureRatio="2/1"
      figure={<Convergence className="text-accent-strong" />}
      className="[&_.space-y-6]:max-w-[60rem]"
    >
      <div className="grid gap-10 text-left md:grid-cols-2 md:gap-12">
        {order.map((key) => {
          const panel = panels[key];
          return (
            <div key={key}>
              <h3 className={CAPTION_H3}>{panel.heading}</h3>
              <ul className="mt-2">
                {panel.points.map((point) => (
                  <li
                    key={point.slice(0, 24)}
                    className="border-t border-accent-border/25 py-3 font-sans text-base leading-[1.65] text-muted-foreground"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mx-auto max-w-[40rem] border-t border-accent-border/40 pt-7 text-center font-serif text-[1.35rem] leading-relaxed text-accent-strong italic">
        The chart tells Astrologer Kavita where to look in a {loc.name} home; the home tells her
        which chart remedies matter most right now. One diagnosis, one list.
      </p>
    </FigureSection>
  );
}
