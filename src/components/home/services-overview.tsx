import Link from "next/link";
import { NorthIndianChart, VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SERVICES_OVERVIEW } from "@/content/home";
import type { Service, ServiceLead } from "@/lib/data";
import { QuestionHeading } from "./question-heading";

/** Small gold glyph per lead type: chart for astrology, compass for vastu, both for integrated. */
function LeadGlyph({ lead }: { lead: ServiceLead }) {
  const cls = "size-6 shrink-0 translate-y-0.5 text-accent-strong/80";
  if (lead === "astrology") return <NorthIndianChart decorative className={cls} />;
  if (lead === "vastu") return <VastuCompass decorative hideLabels className={cls} />;
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <NorthIndianChart decorative className={cls} />
      <VastuCompass decorative hideLabels className={cls} />
    </span>
  );
}

/**
 * Every active service, each stating whether it is astrology-led, vastu-led or integrated.
 *
 * A ruled register rather than a grid of cards. Nine boxes read as a catalogue; nine ruled
 * rows read as a practice's list of what it does, which is what this block is — the full index
 * lives at /services. Each row is one hairline, one glyph, a name, a sentence and a duration,
 * and the only hover state is a gold rule drawing itself along the bottom edge.
 */
export function ServicesOverview({ services }: { services: Service[] }) {
  return (
    <Section id={SERVICES_OVERVIEW.id} spacing="lg" tone="muted">
      <Container size="wide" className="space-y-14">
        <QuestionHeading
          block={SERVICES_OVERVIEW}
          route="/"
          id={SERVICES_OVERVIEW.id}
          layout="split"
        />

        <ul className="border-t border-accent-border/40">
          {services.map((service) => (
            <li
              key={service.slug}
              className="group relative border-b border-border/60 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:w-0 after:bg-accent-border after:transition-[width] after:duration-(--duration-slow) after:ease-emphasized after:content-[''] hover:after:w-full"
            >
              <article className="grid items-baseline gap-x-12 gap-y-3 py-7 lg:grid-cols-[minmax(0,22rem)_1fr_auto] lg:py-8">
                <h3 className="flex items-start gap-3.5 font-serif text-xl leading-snug font-medium sm:text-2xl">
                  <LeadGlyph lead={service.lead} />
                  {/* Stretched link: the whole row is the target, the title is the name. */}
                  <Link
                    href={`/services/${service.slug}`}
                    className="no-underline transition-colors duration-(--duration-base) group-hover:text-accent-strong after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {service.name}
                  </Link>
                </h3>

                <p className="max-w-[56ch] leading-relaxed text-muted-foreground">
                  {service.shortDescription}
                </p>

                <p className="flex items-baseline gap-5 text-sm text-muted-foreground lg:justify-end">
                  <span className="font-semibold tracking-[0.12em] text-accent-strong uppercase">
                    {SERVICES_OVERVIEW.leadLabel[service.lead]}
                  </span>
                  <span className="tabular-nums">{service.durationMinutes} min</span>
                  <span
                    aria-hidden="true"
                    className="inline-block text-accent-strong transition-transform duration-(--duration-base) ease-emphasized group-hover:translate-x-1"
                  >
                    →
                  </span>
                </p>
              </article>
            </li>
          ))}
        </ul>

        <Button asChild variant="link">
          <Link href={SERVICES_OVERVIEW.allLink.href}>{SERVICES_OVERVIEW.allLink.label} →</Link>
        </Button>
      </Container>
    </Section>
  );
}
