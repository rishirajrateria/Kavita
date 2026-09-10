import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HOW_IT_WORKS } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/** The four honest steps of a consultation, as an ordered list. */
export function HowItWorks() {
  return (
    <Section id={HOW_IT_WORKS.id} spacing="md">
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={HOW_IT_WORKS} />

        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.steps.map((step, index) => (
            <li key={step.title} className="border-t border-accent-border/50 pt-5">
              <span
                aria-hidden="true"
                className="font-serif text-4xl leading-none text-accent-strong"
              >
                {index + 1}
              </span>
              <Heading as="h3" level={4} className="mt-3">
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
