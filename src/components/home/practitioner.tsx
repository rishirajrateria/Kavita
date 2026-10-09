import Link from "next/link";
import { PortraitPlate, Rule } from "@/components/content";
import { Disc } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { HERO, PRACTITIONER_CARD } from "@/content/home";
import type { SiteSettings } from "@/lib/data";

/**
 * The person. One glass plate carrying the portrait (a labelled placeholder until
 * {{PRACTITIONER PHOTO}} arrives), and beside it the entity sentence that search engines and
 * answer engines resolve the practice from (CLAUDE.md §9.9) with the two actions: the parchment
 * disc, and a ghost link. Trust comes from a face and a plain declarative sentence; /about
 * carries the biography.
 */
export function Practitioner({ settings }: { settings: SiteSettings }) {
  const { practitionerName, city, country } = settings;

  return (
    <Section id={PRACTITIONER_CARD.id} spacing="lg">
      <Container size="wide">
        <div className="mx-auto grid max-w-[54rem] items-center gap-10 sm:grid-cols-[minmax(0,17rem)_1fr] sm:gap-12 lg:gap-16">
          <PortraitPlate name={practitionerName} className="max-w-[17rem]" />

          <div className="text-center sm:text-left">
            <Rule tone="muted" className="justify-center sm:justify-start">
              {PRACTITIONER_CARD.eyebrow}
            </Rule>
            <p className="mx-auto mt-5 max-w-[36rem] font-serif text-[1.15rem] leading-[1.55] text-foreground sm:mx-0">
              {HERO.entity(practitionerName, city, country)}
            </p>
            <div className="mt-7 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <Disc
                size="sm"
                href={PRACTITIONER_CARD.cta.href}
                label={PRACTITIONER_CARD.cta.label}
              />
              <Link
                href={PRACTITIONER_CARD.secondary.href}
                className="inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1"
              >
                {PRACTITIONER_CARD.secondary.label}
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
