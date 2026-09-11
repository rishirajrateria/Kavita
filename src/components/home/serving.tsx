import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { SERVING } from "@/content/home";
import { locationHref, type Location } from "@/lib/data";
import { QuestionHeading } from "./question-heading";

/**
 * Country and featured-city links to both geo families (CLAUDE.md §5): the home page is the
 * root of the geo link graph, so every published country and featured city is reachable from
 * here in one click for both `/astrologer/…` and `/vastu-consultant/…`. Countries are
 * segmented ivory pills on indigo; cities a compact two-column list.
 */
export function Serving({ countries, cities }: { countries: Location[]; cities: Location[] }) {
  return (
    <Section id={SERVING.id} spacing="lg" tone="inverse" className="grain overflow-hidden">
      <Container size="wide" className="relative space-y-12">
        <QuestionHeading block={SERVING} route="/" id={SERVING.id} layout="split" />

        {countries.length > 0 ? (
          <div>
            <Heading as="h3" level={5} className="mb-5 text-accent-strong">
              {SERVING.countriesHeading}
            </Heading>
            <ul className="flex flex-wrap gap-3">
              {countries.map((location) => (
                <li
                  key={location.path}
                  className="flex min-h-11 w-full items-stretch overflow-hidden rounded-full border border-ivory-100/25 bg-ivory-50/5 text-sm sm:w-auto"
                >
                  <span className="inline-flex flex-1 items-center pr-3 pl-5 font-serif text-base text-foreground sm:flex-none">
                    {location.name}
                  </span>
                  <PillLink href={locationHref(location, "astrologer")} name={location.name}>
                    {SERVING.astrologerLabel}
                  </PillLink>
                  <PillLink href={locationHref(location, "vastu-consultant")} name={location.name}>
                    {SERVING.vastuLabel}
                  </PillLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {cities.length > 0 ? (
          <div>
            <Heading as="h3" level={5} className="mb-4 text-accent-strong">
              {SERVING.citiesHeading}
            </Heading>
            <ul className="grid gap-x-10 border-t border-border sm:grid-cols-2">
              {cities.map((location) => (
                <li
                  key={location.path}
                  className="flex flex-wrap items-center justify-between gap-x-4 border-b border-border py-1.5"
                >
                  <span className="font-medium">{location.name}</span>
                  <span className="flex gap-1 text-sm">
                    <CityLink href={locationHref(location, "astrologer")} name={location.name}>
                      {SERVING.astrologerLabel}
                    </CityLink>
                    <CityLink
                      href={locationHref(location, "vastu-consultant")}
                      name={location.name}
                    >
                      {SERVING.vastuLabel}
                    </CityLink>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Hubs:{" "}
          <Link
            href="/astrology"
            className="text-accent-strong underline decoration-accent-border/60 underline-offset-[3px] hover:decoration-accent-strong"
          >
            Vedic astrology
          </Link>
          {" · "}
          <Link
            href="/vastu"
            className="text-accent-strong underline decoration-accent-border/60 underline-offset-[3px] hover:decoration-accent-strong"
          >
            Vastu consultation
          </Link>
        </p>
      </Container>
    </Section>
  );
}

function PillLink({
  href,
  name,
  children,
}: {
  href: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center border-l border-ivory-100/20 px-3.5 text-foreground no-underline transition-colors hover:bg-cta hover:text-cta-foreground focus-visible:bg-cta focus-visible:text-cta-foreground focus-visible:outline-none"
    >
      {children}
      <span className="sr-only"> in {name}</span>
    </Link>
  );
}

function CityLink({
  href,
  name,
  children,
}: {
  href: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md px-2 text-accent-strong no-underline underline-offset-[3px] hover:underline"
    >
      {children}
      <span className="sr-only"> in {name}</span>
    </Link>
  );
}
