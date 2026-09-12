import { AstronomicalLines, NorthIndianChart, Ornament, VastuCompass } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { METHOD } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/**
 * The centrepiece (CLAUDE.md §1): birth chart and vastu as two instruments of one reading,
 * with the worked anonymised pattern.
 *
 * Structurally this is three things and no boxes: the question, the two instruments side by
 * side across a single vertical gold hairline, and the combined diagnosis. The two instruments
 * are deliberately NOT cards — the argument of the section is that they are one method, and a
 * pair of bordered panels says the opposite. The only lifted object is the combined diagnosis,
 * which is the one place the two actually meet; it is the section's single glass plate.
 */
export function Method() {
  return (
    <Section id={METHOD.id} spacing="lg" tone="inverse" className="grain overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-[8vw] text-accent-border/25"
      >
        <AstronomicalLines decorative strokeWidth={0.75} className="w-full" />
      </div>

      <Container size="wide" className="relative space-y-20 lg:space-y-28">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-end lg:gap-16">
          <QuestionHeading
            block={METHOD}
            route="/"
            id={METHOD.id}
            answerClassName="text-xl"
            layout="stack"
          />
          <p className="font-serif text-2xl leading-[1.15] text-accent-strong italic sm:text-3xl lg:text-right lg:text-4xl">
            {METHOD.tagline}
          </p>
        </div>

        {/* One rule above the pair, one rule between them — no panels. */}
        <div className="grid gap-16 border-t border-accent-border/30 pt-14 lg:grid-cols-2 lg:gap-0 lg:pt-16">
          <Instrument
            heading={METHOD.chart.heading}
            intro={METHOD.chart.intro}
            points={METHOD.chart.points}
            answers={METHOD.chart.answers}
            className="lg:pr-14 xl:pr-20"
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
            className="border-t border-accent-border/30 pt-16 lg:border-t-0 lg:border-l lg:border-accent-border/30 lg:pt-0 lg:pl-14 xl:pl-20"
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

        <article className="glass border-accent-border/35 px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="flex justify-center text-accent-strong">
            <Ornament className="size-7" strokeWidth={1.1} />
          </div>
          <Heading as="h3" level={2} className="mx-auto mt-7 max-w-[30ch] text-center">
            {METHOD.combined.heading}
          </Heading>
          <p className="mx-auto mt-6 max-w-prose text-center text-lg leading-relaxed text-muted-foreground">
            {METHOD.combined.intro}
          </p>

          <div className="mx-auto mt-16 max-w-[62ch]">
            <h4 className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase">
              {METHOD.combined.exampleHeading}
            </h4>
            <div className="mt-6 space-y-6 border-l border-accent-border/70 pl-6 font-serif text-[1.3rem] leading-[1.5] italic sm:pl-8 sm:text-[1.55rem]">
              {METHOD.combined.example.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <p className="mt-10 border-t border-accent-border/30 pt-6 leading-relaxed text-muted-foreground">
              {METHOD.combined.closing}
            </p>
          </div>
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
  className,
}: {
  heading: string;
  intro: string;
  points: readonly string[];
  answers: string;
  motif: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("relative flex flex-col gap-6", className)}>
      {/* The instrument itself, at watermark strength behind its own heading. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 right-0 w-32 text-accent-strong/25 sm:w-40"
      >
        {motif}
      </div>
      <Heading as="h3" level={3} tone="accent" className="relative max-w-[20ch]">
        {heading}
      </Heading>
      <p className="relative max-w-[44ch] text-lg leading-relaxed">{intro}</p>
      <ul className="space-y-4 leading-relaxed text-muted-foreground">
        {points.map((point) => (
          <li key={point.slice(0, 24)} className="flex gap-4">
            <span aria-hidden="true" className="mt-3 h-px w-5 shrink-0 bg-accent-border/70" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-2 font-serif text-lg text-accent-strong">{answers}</p>
    </article>
  );
}
