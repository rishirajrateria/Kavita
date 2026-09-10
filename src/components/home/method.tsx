import { NorthIndianChart, VastuCompass } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { METHOD } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/**
 * The centrepiece (CLAUDE.md §1): birth chart and vastu as two instruments of one reading,
 * with the worked anonymised pattern. Gold tone and larger type make it the strongest section.
 */
export function Method() {
  return (
    <Section id={METHOD.id} spacing="lg" tone="gold" bordered className="scroll-mt-24">
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={METHOD} answerClassName="text-xl" />

        <p className="font-serif text-2xl text-accent-strong sm:text-3xl">{METHOD.tagline}</p>

        <div className="grid gap-8 lg:grid-cols-2">
          <Instrument
            heading={METHOD.chart.heading}
            intro={METHOD.chart.intro}
            points={METHOD.chart.points}
            answers={METHOD.chart.answers}
            motif={
              <NorthIndianChart
                title="North Indian style birth chart"
                description="A square divided into twelve houses, the diamond layout used for a kundli in north India."
              />
            }
          />
          <Instrument
            heading={METHOD.vastu.heading}
            intro={METHOD.vastu.intro}
            points={METHOD.vastu.points}
            answers={METHOD.vastu.answers}
            motif={
              <VastuCompass
                title="Vastu compass rose"
                description="The eight directions of a vastu plan, north at the top."
              />
            }
          />
        </div>

        <article className="rounded-xl border border-accent-border/50 bg-background/70 p-6 sm:p-10">
          <Heading as="h3" level={3}>
            {METHOD.combined.heading}
          </Heading>
          <p className="mt-4 max-w-prose text-lg leading-relaxed">{METHOD.combined.intro}</p>

          <Heading as="h4" level={5} className="mt-8 text-accent-strong">
            {METHOD.combined.exampleHeading}
          </Heading>
          <div className="mt-3 max-w-prose space-y-4 text-lg leading-relaxed">
            {METHOD.combined.example.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-6 max-w-prose border-t border-accent-border/40 pt-5 text-muted-foreground">
            {METHOD.combined.closing}
          </p>
        </article>
      </Container>
    </Section>
  );
}

function Instrument({
  heading,
  intro,
  points,
  answers,
  motif,
}: {
  heading: string;
  intro: string;
  points: readonly string[];
  answers: string;
  motif: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-5 rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <div className="w-24 text-accent-strong sm:w-28">{motif}</div>
      <Heading as="h3" level={3}>
        {heading}
      </Heading>
      <p className="text-lg leading-relaxed">{intro}</p>
      <ul className="space-y-3 border-t border-accent-border/40 pt-5 leading-relaxed">
        {points.map((point) => (
          <li key={point.slice(0, 24)} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent-strong"
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto font-serif text-lg text-accent-strong">{answers}</p>
    </article>
  );
}
