import { QuestionHeading } from "@/components/home/question-heading";
import { VastuCompass } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { Question } from "./answers";
import { paragraphs } from "./opening";

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
] as const;

/**
 * Vastu pages: the researched climate-and-housing facts that genuinely change the advice here,
 * the 150–250 word narrative, and (city pages) the four steps of a remote review. Compass motif
 * as backdrop.
 */
export function GeoArchitecture({
  loc,
  question,
  route,
  showRemoteProcess = false,
  tone = "default",
}: {
  loc: LocationRecord;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  showRemoteProcess?: boolean;
  tone?: "default" | "muted";
}) {
  const ca = loc.research?.climateArchitecture;
  if (!ca) return null;

  return (
    <Section
      id="architecture"
      spacing="lg"
      tone={tone}
      bordered={tone === "muted"}
      className="overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -bottom-28 w-80 text-gold-500/15 sm:w-[28rem] dark:text-gold-300/10"
      >
        <VastuCompass decorative hideLabels description="" strokeWidth={0.6} />
      </div>
      <Container size="wide" className="relative space-y-10">
        <QuestionHeading block={question} route={route} id="architecture" layout="split" />

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-5 text-lg leading-relaxed">
            {paragraphs(ca.narrative).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          <aside className="self-start border-t border-accent-border/50 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <Heading
              as="h3"
              level={6}
              className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
            >
              Site conditions that shape the advice in {loc.name}
            </Heading>
            <ul className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
              {ca.facts.map((fact) => (
                <li key={fact.slice(0, 32)} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent-strong"
                  />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-3 border-t border-accent-border/40 pt-5 text-sm">
              <div>
                <dt className="font-semibold text-foreground">Housing stock</dt>
                <dd className="text-muted-foreground">{ca.housingStock}</dd>
              </div>
              {ca.plotOrientation ? (
                <div>
                  <dt className="font-semibold text-foreground">Plot orientation</dt>
                  <dd className="text-muted-foreground">{ca.plotOrientation}</dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </div>

        {showRemoteProcess ? (
          <div className="border-t border-accent-border/40 pt-10">
            <Heading as="h3" level={3} className="max-w-[28ch]">
              How a remote vastu review of a {loc.name} home works
            </Heading>
            <ol className="relative mt-8 grid gap-8 before:absolute before:top-2 before:bottom-2 before:left-6 before:w-px before:bg-accent-border/50 before:content-[''] lg:grid-cols-4 lg:gap-6 lg:before:inset-x-0 lg:before:top-8 lg:before:bottom-auto lg:before:h-px lg:before:w-auto">
              {REMOTE_STEPS.map((step, index) => (
                <li key={step.title} className="relative pl-20 lg:pl-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 inline-flex h-12 w-12 items-center justify-center bg-background font-serif text-3xl leading-none text-accent-strong lg:static lg:mb-6 lg:h-16 lg:w-auto lg:justify-start lg:pr-5 lg:text-5xl"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Heading as="h4" level={5}>
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </Heading>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
