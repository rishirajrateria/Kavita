import { FigureSection } from "@/components/content";
import { Convergence } from "@/components/motifs";
import { INSTRUMENTS } from "@/content/home";

/**
 * Plate I — two instruments, one reading, as a drawing first and a sentence second.
 *
 * The Convergence figure shows a chart and a floor plan carried down into one point; the ruled
 * line under it names the parts in three Cinzel phrases. The question-form H2 and its answer
 * follow the picture (CLAUDE.md §9.2) rather than replace it.
 */
export function Instruments() {
  return (
    <FigureSection
      id={INSTRUMENTS.id}
      route="/"
      n="I"
      question={INSTRUMENTS.question}
      answer={INSTRUMENTS.answer}
      figureWidth="wide"
      figureRatio="2/1"
      figure={
        <Convergence
          title="A birth chart and a floor plan read as one"
          description="On the left a North Indian birth chart with its fourth house shaded; on the right the plan of a home with its south-west room shaded. Two lines carry both down into a single point, below which the two figures have become one."
        />
      }
      line={
        <span className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1">
          <span className="whitespace-nowrap">{INSTRUMENTS.captions.chart}</span>
          <span aria-hidden="true" className="hidden opacity-60 sm:inline">
            ·
          </span>
          <span className="whitespace-nowrap text-accent-strong">
            {INSTRUMENTS.captions.together}
          </span>
          <span aria-hidden="true" className="hidden opacity-60 sm:inline">
            ·
          </span>
          <span className="whitespace-nowrap">{INSTRUMENTS.captions.home}</span>
        </span>
      }
    />
  );
}
