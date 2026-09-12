import Link from "next/link";
import { SouthIndianChart, VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

export interface CtaBandProps {
  eyebrow?: string;
  /** The H2 — phrase it as a question where possible ("Ready to have both read together?"). */
  title: string;
  /** One short paragraph; when it is a 40–60 word self-contained answer, pass `asAnswer`. */
  body: string;
  asAnswer?: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  motif?: "compass" | "south-chart";
  id?: string;
}

/** Closing call to action on deep indigo with paper grain — the last band of every content page. */
export function CtaBand({
  eyebrow = "Next step",
  title,
  body,
  asAnswer = false,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  motif = "south-chart",
  id = "book",
}: CtaBandProps) {
  const external = secondaryHref ? /^(https?:|mailto:|tel:)/.test(secondaryHref) : false;
  const arrow = (
    <span aria-hidden="true" data-arrow className="inline-block">
      →
    </span>
  );

  return (
    <Section
      id={id}
      spacing="lg"
      tone="inverse"
      depth="deep"
      className="grain scroll-mt-20 overflow-hidden border-t border-border"
    >
      <div
        aria-hidden="true"
        data-breathe
        className="pointer-events-none absolute top-1/2 left-1/2 w-[38rem] -translate-x-1/2 -translate-y-1/2 text-accent-strong/12 sm:w-[46rem]"
      >
        {motif === "compass" ? (
          <VastuCompass decorative hideLabels description="" strokeWidth={0.6} />
        ) : (
          <SouthIndianChart decorative strokeWidth={0.6} />
        )}
      </div>

      <Container size="narrow" className="relative space-y-8 text-center">
        <Heading
          as="h2"
          level={2}
          eyebrow={eyebrow}
          className="mx-auto max-w-[22ch] text-5xl leading-[1.06] [&>[data-slot=eyebrow]]:justify-center"
        >
          {title}
        </Heading>
        {asAnswer ? (
          <p className="answer mx-auto max-w-[56ch] border-s-0 border-t border-accent-border/50 ps-0 pt-7 text-left sm:text-center">
            {body}
          </p>
        ) : (
          <p className="mx-auto max-w-[56ch] border-t border-accent-border/50 pt-7 text-lg leading-relaxed text-muted-foreground">
            {body}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild variant="gold" size="xl">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild variant="ghost" size="xl">
              {external ? (
                <a href={secondaryHref} rel="noopener">
                  {secondaryLabel}
                  {arrow}
                </a>
              ) : (
                <Link href={secondaryHref}>
                  {secondaryLabel}
                  {arrow}
                </Link>
              )}
            </Button>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
