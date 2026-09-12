import { DashaTimeline } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TIMING } from "@/content/home";

/**
 * "When, not only what" — the thing that makes someone want to book: a reading gives timing.
 *
 * The Vimshottari dasha timeline is the picture; one caption and the answer paragraph are the
 * words. The active period is marked, which is the whole promise of the section in one mark.
 */
export function Timing() {
  return (
    <Section id={TIMING.id} spacing="lg" tone="muted">
      <Container size="wide">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="max-w-[30rem]">
            <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
              {TIMING.eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-[clamp(1.7rem,1.2rem+2vw,2.6rem)] leading-tight font-normal text-balance">
              {TIMING.question}
            </h2>
            <p className="answer mt-6 text-base sm:text-lg">{TIMING.answer}</p>
          </div>

          <figure className="glass sheen p-6 sm:p-8" style={{ ["--sheen-delay" as string]: "4s" }}>
            <DashaTimeline activeIndex={4} />
            <figcaption className="mt-5 text-center text-sm text-muted-foreground">
              {TIMING.caption}
            </figcaption>
          </figure>
        </div>
      </Container>
    </Section>
  );
}
