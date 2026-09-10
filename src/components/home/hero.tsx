import Image from "next/image";
import Link from "next/link";
import { VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HERO } from "@/content/home";
import type { SiteSettings } from "@/lib/data";

/**
 * Above the fold: the combined method in one line (the page's only H1), one subhead, two calls
 * to action and the compact entity line — all in the HTML. A very large, low-opacity vastu
 * compass sits off-canvas top-right as backdrop linework; a soft gold radial glow sits behind
 * the arched portrait, which is a labelled placeholder until {{PRACTITIONER PHOTO}} arrives.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  const { practitionerName, city, country } = settings;

  return (
    <Section
      as="header"
      spacing="none"
      className="overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24"
    >
      {/* Backdrop linework: ≈64vw compass, clipped by the section, never in the way of text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-30vw] right-[-42vw] w-[84vw] text-gold-500/20 lg:top-[-18vw] lg:right-[-16vw] lg:w-[62vw] dark:text-gold-300/12"
      >
        <VastuCompass decorative hideLabels strokeWidth={0.75} />
      </div>

      <Container
        size="wide"
        className="relative grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-10"
      >
        <div className="max-w-[46rem]">
          <Heading
            as="h1"
            level="display"
            eyebrow={HERO.eyebrow}
            className="text-[clamp(2.5rem,1.45rem+3.9vw,4.6rem)] leading-[1.02] tracking-[-0.02em]"
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

        <figure className="relative mx-auto w-full max-w-[17rem] sm:max-w-xs lg:max-w-[22rem]">
          {/* Soft gold glow behind the portrait — a gradient, not a graphic. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 size-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(184_146_58_/_0.16),transparent_72%)] dark:bg-[radial-gradient(closest-side,rgb(203_168_79_/_0.12),transparent_72%)]"
          />
          <div className="arch arch-frame relative overflow-hidden border border-accent-border/60 bg-linear-to-b from-ivory-50 to-ivory-200 shadow-lg dark:from-indigo-900 dark:to-indigo-950">
            <Image
              src={HERO.photo.src}
              width={HERO.photo.width}
              height={HERO.photo.height}
              alt={HERO.photo.alt(practitionerName)}
              priority
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 17rem"
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-4 text-center text-sm text-muted-foreground">
            <span className="font-serif text-base text-foreground">{practitionerName}</span>
            <span aria-hidden="true"> · </span>
            Astrologer Kavita
          </figcaption>
        </figure>
      </Container>
    </Section>
  );
}
