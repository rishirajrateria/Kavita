import { Convergence } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { INSTRUMENTS } from "@/content/home";

/**
 * Two instruments, one reading — as a drawing first and a sentence second.
 *
 * The Convergence figure shows a chart and a floor plan carried down into one point. Three
 * captions name the parts. The question-form H2 and its answer paragraph stay (CLAUDE.md §9.2),
 * but they follow the picture rather than replace it.
 */
export function Instruments() {
  return (
    <Section id={INSTRUMENTS.id} spacing="lg">
      <Container size="wide">
        <div className="mx-auto max-w-[36rem] text-center">
          <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
            {INSTRUMENTS.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-[clamp(1.7rem,1.2rem+2vw,2.6rem)] leading-tight font-normal text-balance">
            {INSTRUMENTS.question}
          </h2>
        </div>

        <figure className="mx-auto mt-10 max-w-[52rem] sm:mt-14">
          <div data-parallax style={{ ["--parallax-depth" as string]: "18px" }}>
            <Convergence
              title="A birth chart and a floor plan read as one"
              description="On the left a North Indian birth chart with its fourth house shaded; on the right the plan of a home with its south-west room shaded. Two lines carry both down into a single point, below which the two figures have become one."
            />
          </div>
          <figcaption className="mt-6 grid grid-cols-3 gap-3 text-center text-[0.72rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase sm:text-xs">
            <span>{INSTRUMENTS.captions.chart}</span>
            <span className="text-accent-strong">{INSTRUMENTS.captions.together}</span>
            <span>{INSTRUMENTS.captions.home}</span>
          </figcaption>
        </figure>

        <p className="answer mx-auto mt-10 max-w-[36rem] text-center text-base sm:text-lg">
          {INSTRUMENTS.answer}
        </p>
      </Container>
    </Section>
  );
}
