import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NorthIndianChart, VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import type { LinkGraph } from "@/lib/geo/linking";
import { GEO_SERVICE_META, geoBookHref, geoH1 } from "@/lib/geo/service";

/**
 * Above the fold of a geo page: breadcrumb trail (visible + BreadcrumbList JSON-LD), the page's
 * only H1, a one-line subhead for the place, the primary CTA and the counterpart link. One
 * large, low-opacity motif — chart for astrology, compass for vastu — sits off-canvas as the
 * backdrop, as on the home page. No client JavaScript.
 */
export function GeoHero({
  loc,
  service,
  graph,
  countryName,
}: {
  loc: LocationRecord;
  service: GeoService;
  graph: LinkGraph;
  /** Country the place belongs to (from the full ancestor chain, publishable or not). */
  countryName: string;
}) {
  const meta = GEO_SERVICE_META[service];
  const trail = [
    ...graph.ancestors.map((a) => ({ name: a.name, href: graph.href(a) })),
    { name: loc.name, href: graph.href(loc) },
  ];
  const eyebrow =
    loc.type === "country"
      ? `${meta.label} · online across ${loc.name}`
      : `${meta.label} · ${countryName}`;

  return (
    <Section
      as="header"
      spacing="none"
      className="overflow-hidden pt-4 pb-16 sm:pb-20 lg:pb-24"
      aria-labelledby="geo-h1"
    >
      <div
        aria-hidden="true"
        data-breathe
        className={
          meta.motif === "compass"
            ? "pointer-events-none absolute top-[-26vw] right-[-40vw] w-[80vw] text-accent-strong/15 lg:top-[-16vw] lg:right-[-14vw] lg:w-[54vw]"
            : "pointer-events-none absolute top-[-14vw] right-[-30vw] w-[70vw] rotate-6 text-accent-strong/15 lg:top-[-10vw] lg:right-[-10vw] lg:w-[46vw]"
        }
      >
        {meta.motif === "compass" ? (
          <VastuCompass decorative hideLabels description="" strokeWidth={0.75} />
        ) : (
          <NorthIndianChart decorative strokeWidth={0.6} />
        )}
      </div>

      <Container size="wide" className="relative">
        <Breadcrumbs items={trail} className="mb-8 sm:mb-12" />

        <div className="max-w-[46rem]">
          <Heading
            as="h1"
            level="display"
            id="geo-h1"
            eyebrow={eyebrow}
            className="text-[clamp(2.4rem,1.4rem+3.6vw,4.4rem)] leading-[1.04] tracking-[-0.02em] text-balance"
          >
            {geoH1(loc, service)}
          </Heading>

          <p className="mt-7 max-w-[38rem] text-lg leading-relaxed text-muted-foreground">
            {service === "astrologer"
              ? `Vedic astrology and vastu, read together as one consultation for clients ${loc.type === "country" ? "across" : "in"} ${loc.name} — online, in ${loc.name}'s own hours, with the home read as part of the same picture.`
              : `Vastu shastra for homes and workplaces ${loc.type === "country" ? "across" : "in"} ${loc.name}, read together with the occupants' birth charts — from a floor plan and photographs, in ${loc.name}'s own hours.`}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild variant="gold" size="xl">
              <Link href={geoBookHref(loc)}>Book a consultation</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href={graph.counterpart.href}>
                {graph.counterpart.label}
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            </Button>
          </div>

          <p className="mt-10 max-w-[38rem] border-t border-accent-border/40 pt-6 text-sm leading-relaxed text-muted-foreground">
            {loc.name} keeps {loc.timezone}. Consultations in {loc.languages.join(", ")}. Astrologer
            Kavita reads the kundli — the Vedic birth chart — and the vastu of the home as one
            method with two instruments, never as two separate services.
          </p>
        </div>
      </Container>
    </Section>
  );
}
