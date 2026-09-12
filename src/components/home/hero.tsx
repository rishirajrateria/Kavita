import Link from "next/link";
import { Instrument } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HERO } from "@/content/home";
import type { SiteSettings } from "@/lib/data";

/**
 * Above the fold: the combined method in one line (the page's only H1), one subhead, two calls
 * to action and the compact entity line — all in the HTML, none of it behind JavaScript.
 *
 * The centrepiece is the Instrument, not a portrait: a kundli drawn over the vastu mandala is
 * the one image that states the practice's actual argument, where a photograph states only that
 * a person exists. It sits on a frosted plate so the starfield behind it diffuses through the
 * blur — the plate is why the <Sky /> in the root layout has something to do. The practitioner's
 * photograph carries the E-E-A-T signal on /about, where a reader has asked who she is.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  const { practitionerName, city, country } = settings;

  return (
    <Section as="header" spacing="none" className="pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
      <Container
        size="wide"
        className="relative grid gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-16"
      >
        <div className="max-w-[46rem]">
          <Heading
            as="h1"
            level="display"
            eyebrow={HERO.eyebrow}
            className="text-[clamp(2.4rem,1.5rem+3.2vw,4.1rem)] leading-[1.04] tracking-[-0.018em]"
          >
            {HERO.h1}
          </Heading>

          <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-muted-foreground">
            {HERO.subhead}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="gold" size="xl">
              <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <a href={HERO.secondaryCta.href}>
                {HERO.secondaryCta.label}
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </a>
            </Button>
          </div>

          <p className="mt-8 max-w-[36rem] border-t border-accent-border/40 pt-5 text-sm leading-relaxed text-muted-foreground">
            {HERO.entity(practitionerName, city, country)}
          </p>
        </div>

        <figure className="mx-auto w-full max-w-[24rem] lg:max-w-none">
          <div className="glass p-5 sm:p-7">
            <Instrument
              title="The two instruments of the reading"
              description="A North Indian kundli — a square with its diagonals and an inscribed diamond — drawn over the nine-by-nine grid of the vastu purusha mandala, with the brahmasthan left open at the centre and twelve house ticks around the rim."
            />
          </div>
          <figcaption className="mt-4 text-center text-sm text-muted-foreground">
            The kundli and the vastu mandala,{" "}
            <span className="text-foreground">read as one square</span>
          </figcaption>
        </figure>
      </Container>
    </Section>
  );
}
