import Link from "next/link";
import { SouthIndianChart } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FINAL_CTA } from "@/content/home";

/** Closing call to action on deep indigo: book, or ask first. */
export function FinalCta() {
  return (
    <Section
      id={FINAL_CTA.id}
      spacing="lg"
      tone="inverse"
      depth="deep"
      className="grain overflow-hidden border-t border-border"
    >
      {/* Large, faint South Indian chart grid as backdrop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[38rem] -translate-x-1/2 -translate-y-1/2 text-gold-300/10 sm:w-[46rem]"
      >
        <SouthIndianChart decorative strokeWidth={0.6} />
      </div>

      <Container size="narrow" className="relative space-y-7 text-center">
        <Heading
          as="h2"
          level={2}
          eyebrow={FINAL_CTA.eyebrow}
          className="mx-auto max-w-[22ch] text-4xl [&>[data-slot=eyebrow]]:justify-center"
        >
          {FINAL_CTA.heading}
        </Heading>
        <p className="mx-auto max-w-prose text-lg leading-relaxed text-muted-foreground">
          {FINAL_CTA.body}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold" size="xl">
            <Link href={FINAL_CTA.primaryCta.href}>{FINAL_CTA.primaryCta.label}</Link>
          </Button>
          <Button asChild variant="ghost" size="xl">
            <Link href={FINAL_CTA.secondaryCta.href}>
              {FINAL_CTA.secondaryCta.label}
              <span aria-hidden="true" data-arrow className="inline-block">
                →
              </span>
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
