import { FigureSection, StepLine } from "@/components/content";
import { FloorPlan } from "@/components/motifs";
import type { LocationRecord } from "@/content/locations/schema";
import type { Question } from "./answers";
import { FactList } from "./fact-list";
import { CAPTION_H3, Paragraphs, type Plate, SmallFigure } from "./parts";

const REMOTE_STEPS = [
  {
    title: "Floor plan with north marked",
    body: "From the sale or tenancy documents, or a careful hand sketch. Room names and the front door are enough; measurements help but are not required.",
  },
  {
    title: "Compass reading at the entrance",
    body: "Stand inside the main door facing out and note the bearing from a phone compass. This fixes the orientation the whole reading rests on.",
  },
  {
    title: "Photographs and who uses which room",
    body: "Entrance, kitchen, main bedroom, study and anything that concerns you, plus a note of who sleeps and works where.",
  },
  {
    title: "The session and the written observations",
    body: "The plan is read on screen with the occupants' charts; the suggestions — room use, direction, colour, storage first — arrive in writing afterwards.",
  },
];

/**
 * Vastu pages: the researched climate-and-housing facts that genuinely change the advice here,
 * as a column plate — a plan of the nine zones on the left; on the right the question, its
 * answer, the site conditions as a ruled list, housing stock and plot orientation, the 150–250
 * word narrative and (city pages) the four steps of a remote review on a ruled line, titles
 * visible and their bodies folded beneath. Every researched fact is visible.
 */
export function GeoArchitecture({
  loc,
  question,
  route,
  showRemoteProcess = false,
  plate,
}: {
  loc: LocationRecord;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  showRemoteProcess?: boolean;
  plate: Plate;
}) {
  const ca = loc.research?.climateArchitecture;
  if (!ca) return null;
  const stock: [string, string][] = [["Housing stock", ca.housingStock]];
  if (ca.plotOrientation) stock.push(["Plot orientation", ca.plotOrientation]);

  return (
    <FigureSection
      id="architecture"
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
          <FloorPlan className="text-accent-strong" />
        </SmallFigure>
      }
    >
      <div>
        <h3 className={CAPTION_H3}>Site conditions that shape the advice in {loc.name}</h3>
        <ul className="mt-2">
          {ca.facts.map((fact) => (
            <li
              key={fact.slice(0, 32)}
              className="border-t border-accent-border/25 py-3 font-serif text-[1.1rem] leading-snug text-foreground"
            >
              {fact}
            </li>
          ))}
        </ul>
      </div>
      <FactList facts={stock} />
      <Paragraphs text={ca.narrative} />

      {showRemoteProcess ? (
        <div className="pt-4">
          <h3 className="font-serif text-[1.35rem] leading-snug font-normal text-foreground">
            How a remote vastu review of a {loc.name} home works
          </h3>
          <StepLine steps={REMOTE_STEPS} className="mt-6 [&_.more]:mx-0" />
        </div>
      ) : null}
    </FigureSection>
  );
}
