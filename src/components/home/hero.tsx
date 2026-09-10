import Image from "next/image";
import Link from "next/link";
import { AstronomicalLines } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HERO } from "@/content/home";
import type { SiteSettings } from "@/lib/data";

/**
 * Above the fold: the combined method in one line (the page's only H1), who she is, what she
 * does and why it is different — all in the HTML. The portrait is a labelled placeholder until
 * the real photograph ({{PRACTITIONER PHOTO}}) is supplied.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  const { practitionerName, city, country } = settings;

  return (
    <Section as="header" spacing="lg" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-24 hidden w-[52rem] max-w-none text-accent-strong/30 lg:block"
      >
        <AstronomicalLines decorative strokeWidth={1} />
      </div>

      <Container
        size="wide"
        className="relative grid gap-12 lg:grid-cols-[7fr_4fr] lg:items-center"
      >
        <div className="max-w-[46rem]">
          <Heading
            as="h1"
            level="display"
            eyebrow={HERO.eyebrow}
            className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl"
          >
            {HERO.h1}
          </Heading>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {HERO.subhead}
          </p>
          <p className="mt-5 max-w-prose leading-relaxed">
            {HERO.entity(practitionerName, city, country)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</a>
            </Button>
          </div>
        </div>

        <figure className="mx-auto w-full max-w-xs lg:max-w-sm">
          <Image
            src={HERO.photo.src}
            width={HERO.photo.width}
            height={HERO.photo.height}
            alt={HERO.photo.alt(practitionerName)}
            priority
            sizes="(min-width: 1024px) 24rem, 20rem"
            className="h-auto w-full rounded-xl border border-accent-border/40 shadow-md"
          />
          <figcaption className="mt-3 text-center text-sm text-muted-foreground">
            {practitionerName}, Astrologer Kavita
          </figcaption>
        </figure>
      </Container>
    </Section>
  );
}
