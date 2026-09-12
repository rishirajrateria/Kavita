import Link from "next/link";
import { Ornament, SouthIndianChart } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FINAL_CTA } from "@/content/home";

/**
 * Closing call to action on the deepest indigo: book, or ask first.
 *
 * The page ends on empty sky. Nothing here is boxed — one faint chart grid turning behind the
 * words, a gold ornament, three lines and the single loud thing on the page, which is the gold
 * button. The generous block padding is the point: after nine sections of argument the eye
 * should arrive somewhere quiet.
 */
export function FinalCta() {
  return (
    <Section
      id={FINAL_CTA.id}
      spacing="none"
      tone="inverse"
      depth="deep"
      className="grain overflow-hidden border-t border-accent-border/25 py-24 sm:py-32 lg:py-40"
    >
      {/* Large, faint South Indian chart grid as backdrop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[21rem] -translate-x-1/2 -translate-y-1/2 text-accent-border/12 sm:w-[40rem] lg:w-[64rem]"
      >
        <SouthIndianChart decorative strokeWidth={0.6} />
      </div>

      <Container size="narrow" className="relative flex flex-col items-center text-center">
        <Ornament className="size-7 text-accent-strong" strokeWidth={1.1} data-breathe />

        <Heading
          as="h2"
          level={2}
          eyebrow={FINAL_CTA.eyebrow}
          className="mt-8 max-w-[20ch] text-5xl leading-[1.06] [&>[data-slot=eyebrow]]:justify-center"
        >
          {FINAL_CTA.heading}
        </Heading>

        <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          {FINAL_CTA.body}
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
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
