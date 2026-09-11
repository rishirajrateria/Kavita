import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HOW_IT_WORKS } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/**
 * The four honest steps of a consultation as an ordered list, laid out as a timeline: a thin
 * gold rule runs behind big serif numerals — horizontally on wide screens, down the left edge
 * on phones. The numerals carry the page background so the rule appears to pass behind them.
 */
export function HowItWorks() {
  return (
    <Section id={HOW_IT_WORKS.id} spacing="lg">
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={HOW_IT_WORKS} route="/" id={HOW_IT_WORKS.id} layout="split" />

        <ol className="relative grid gap-10 before:absolute before:top-2 before:bottom-2 before:left-6 before:w-px before:bg-accent-border/50 before:content-[''] lg:grid-cols-4 lg:gap-8 lg:before:inset-x-0 lg:before:top-8 lg:before:bottom-auto lg:before:h-px lg:before:w-auto">
          {HOW_IT_WORKS.steps.map((step, index) => (
            <li key={step.title} className="relative pl-20 lg:pl-0">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 inline-flex h-12 w-12 items-center justify-center bg-background font-serif text-3xl leading-none text-accent-strong lg:static lg:mb-6 lg:h-16 lg:w-auto lg:justify-start lg:pr-5 lg:text-5xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <Heading as="h3" level={4}>
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </Heading>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
