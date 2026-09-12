import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { HERO, PRACTITIONER_CARD } from "@/content/home";
import type { SiteSettings } from "@/lib/data";

/**
 * The person. One glass card: the portrait (a labelled placeholder until {{PRACTITIONER PHOTO}}
 * arrives), the entity sentence that search engines and answer engines resolve the practice
 * from (CLAUDE.md §9.9), and the two actions. Nothing else — trust comes from a face and a
 * plain declarative sentence, not a biography; /about carries the biography.
 */
export function Practitioner({ settings }: { settings: SiteSettings }) {
  const { practitionerName, city, country } = settings;

  return (
    <Section id={PRACTITIONER_CARD.id} spacing="lg">
      <Container size="wide">
        <div
          className="glass sheen mx-auto grid max-w-[54rem] items-center gap-8 p-6 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-10 sm:p-9"
          style={{ ["--sheen-delay" as string]: "9s" }}
        >
          <div className="mx-auto w-full max-w-[13rem]">
            <div
              data-levitate
              className="arch arch-frame relative overflow-hidden border border-accent-border/50 bg-linear-to-b from-card to-muted shadow-lg"
            >
              <Image
                src={HERO.photo.src}
                width={HERO.photo.width}
                height={HERO.photo.height}
                alt={HERO.photo.alt(practitionerName)}
                sizes="13rem"
                className="block h-auto w-full"
              />
            </div>
          </div>

          <div>
            <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
              {PRACTITIONER_CARD.eyebrow}
            </p>
            <p className="mt-3 font-serif text-2xl leading-snug font-normal sm:text-3xl">
              {practitionerName}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {HERO.entity(practitionerName, city, country)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href={PRACTITIONER_CARD.cta.href}>{PRACTITIONER_CARD.cta.label}</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href={PRACTITIONER_CARD.secondary.href}>
                  {PRACTITIONER_CARD.secondary.label}
                  <span aria-hidden="true" data-arrow className="inline-block">
                    →
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
