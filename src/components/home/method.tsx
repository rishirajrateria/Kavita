import { AstronomicalLines, NorthIndianChart, Ornament, VastuCompass } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { METHOD } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/**
 * The centrepiece (CLAUDE.md §1): birth chart and vastu as two instruments of one reading,
 * with the worked anonymised pattern. Deep indigo with paper grain, a faint gold astronomical
 * arc across the top, two glass panels and a double-ruled panel for the combined diagnosis.
 */
export function Method() {
  return (
    <Section id={METHOD.id} spacing="lg" tone="inverse" className="grain overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-[8vw] text-gold-300/18"
      >
        <AstronomicalLines decorative strokeWidth={0.75} className="w-full" />
      </div>

      <Container size="wide" className="relative space-y-12 lg:space-y-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-12">
          <QuestionHeading block={METHOD} answerClassName="text-xl" layout="stack" />
          <p className="font-serif text-3xl leading-tight text-accent-strong italic lg:text-right lg:text-4xl">
            {METHOD.tagline}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Instrument
            heading={METHOD.chart.heading}
            intro={METHOD.chart.intro}
            points={METHOD.chart.points}
            answers={METHOD.chart.answers}
            motif={
              <NorthIndianChart
                title="North Indian style birth chart"
                description="A square divided into twelve houses, the diamond layout used for a kundli in north India."
                strokeWidth={0.75}
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
                hideLabels
                strokeWidth={0.75}
              />
            }
          />
        </div>

        <article className="double-rule relative m-2 rounded-2xl border border-accent-border/50 bg-surface-inverse-deep/60 px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div className="flex justify-center text-accent-strong">
            <Ornament className="size-7" strokeWidth={1.1} />
          </div>
          <Heading as="h3" level={3} className="mt-5 text-center">
            {METHOD.combined.heading}
          </Heading>
          <p className="mx-auto mt-5 max-w-prose text-center text-lg leading-relaxed text-muted-foreground">
            {METHOD.combined.intro}
          </p>

          <Heading
            as="h4"
            level={6}
            className="mt-12 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
          >
            {METHOD.combined.exampleHeading}
          </Heading>
          <div className="mt-5 max-w-[60ch] space-y-5 border-l-2 border-accent-border pl-5 font-serif text-[1.3rem] leading-[1.45] italic sm:pl-7 sm:text-[1.55rem]">
            {METHOD.combined.example.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-8 max-w-prose border-t border-accent-border/40 pt-6 text-muted-foreground">
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
    <article className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-accent-border/25 bg-card p-6 pt-32 text-card-foreground sm:p-8 sm:pt-40">
      {/* Large motif, top-right, partially clipped by the panel edge. */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-44 text-accent-strong/70 sm:-top-10 sm:-right-10 sm:w-56">
        {motif}
      </div>
      <Heading as="h3" level={3} tone="accent" className="max-w-[16ch]">
        {heading}
      </Heading>
      <p className="text-lg leading-relaxed">{intro}</p>
      <ul className="space-y-3 border-t border-accent-border/30 pt-5 leading-relaxed text-muted-foreground">
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
