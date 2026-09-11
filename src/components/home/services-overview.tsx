import Link from "next/link";
import { NorthIndianChart, VastuCompass } from "@/components/motifs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SERVICES_OVERVIEW } from "@/content/home";
import type { Service, ServiceLead } from "@/lib/data";
import { QuestionHeading } from "./question-heading";

/** Small gold glyph per lead type: chart for astrology, compass for vastu, both for integrated. */
function LeadGlyph({ lead }: { lead: ServiceLead }) {
  const cls = "size-7 text-accent-strong";
  if (lead === "astrology") return <NorthIndianChart decorative className={cls} />;
  if (lead === "vastu") return <VastuCompass decorative hideLabels className={cls} />;
  return (
    <span className="flex items-center gap-1.5">
      <NorthIndianChart decorative className={cls} />
      <VastuCompass decorative hideLabels className={cls} />
    </span>
  );
}

/** Every active service, each stating whether it is astrology-led, vastu-led or integrated. */
export function ServicesOverview({ services }: { services: Service[] }) {
  return (
    <Section id={SERVICES_OVERVIEW.id} spacing="lg" tone="muted" bordered>
      <Container size="wide" className="space-y-10">
        <QuestionHeading
          block={SERVICES_OVERVIEW}
          route="/"
          id={SERVICES_OVERVIEW.id}
          layout="split"
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.slug} className="flex">
              {/* Gold hairline at the top edge widens from 24px to full on hover. */}
              <article className="group relative flex w-full flex-col gap-4 overflow-hidden rounded-xl border bg-background p-6 shadow-xs transition-[box-shadow,translate] duration-(--duration-base) ease-standard before:absolute before:top-0 before:left-0 before:h-0.5 before:w-6 before:bg-accent-border before:transition-[width] before:duration-(--duration-slow) before:ease-emphasized hover:-translate-y-0.5 hover:shadow-md hover:before:w-full motion-reduce:hover:translate-y-0">
                <div className="flex items-center justify-between gap-3">
                  <LeadGlyph lead={service.lead} />
                  <Badge variant="caps">{SERVICES_OVERVIEW.leadLabel[service.lead]}</Badge>
                </div>
                <h3 className="font-serif text-xl leading-snug font-medium">
                  {/* Stretched link: the whole card is the target, the title is the name. */}
                  <Link
                    href={`/services/${service.slug}`}
                    className="no-underline group-hover:text-accent-strong after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {service.name}
                  </Link>
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.shortDescription}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2 text-sm text-muted-foreground">
                  <span>{service.durationMinutes} min</span>
                  <span
                    aria-hidden="true"
                    className="inline-block text-accent-strong transition-transform duration-(--duration-base) ease-emphasized group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <Button asChild variant="link" className="px-0">
          <Link href={SERVICES_OVERVIEW.allLink.href}>{SERVICES_OVERVIEW.allLink.label} →</Link>
        </Button>
      </Container>
    </Section>
  );
}
