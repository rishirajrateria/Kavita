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
 * here in one click for both `/astrologer/…` and `/vastu-consultant/…`.
 *
 * Both lists use one idiom at two scales — a name on the left, its two service links on the
 * right, hairline between rows — so the whole index reads as a single ruled register rather
 * than a cluster of pills above a table. The rows are the page's densest link block; keeping
 * them unboxed is what stops that density turning into noise.
 */
export function Serving({ countries, cities }: { countries: Location[]; cities: Location[] }) {
  return (
    <Section id={SERVING.id} spacing="lg" tone="inverse" className="grain overflow-hidden">
      <Container size="wide" className="relative space-y-16">
        <QuestionHeading block={SERVING} route="/" id={SERVING.id} layout="split" />

        {countries.length > 0 ? (
          <div>
            <Heading
              as="h3"
              level={6}
              className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
            >
              {SERVING.countriesHeading}
            </Heading>
            <ul className="mt-6 border-t border-accent-border/40">
              {countries.map((location) => (
                <li
                  key={location.path}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-b border-accent-border/20 py-4"
                >
                  <span className="font-serif text-2xl leading-snug">{location.name}</span>
                  <span className="flex items-center gap-5 text-sm">
                    <GeoLink href={locationHref(location, "astrologer")} name={location.name}>
                      {SERVING.astrologerLabel}
                    </GeoLink>
                    <GeoLink href={locationHref(location, "vastu-consultant")} name={location.name}>
                      {SERVING.vastuLabel}
                    </GeoLink>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {cities.length > 0 ? (
          <div>
            <Heading
              as="h3"
              level={6}
              className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
            >
              {SERVING.citiesHeading}
            </Heading>
            <ul className="mt-6 grid gap-x-16 border-t border-border/60 sm:grid-cols-2">
              {cities.map((location) => (
                <li
                  key={location.path}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border/60 py-3"
                >
                  <span className="font-serif text-lg">{location.name}</span>
                  <span className="flex items-center gap-5 text-sm">
                    <GeoLink href={locationHref(location, "astrologer")} name={location.name}>
                      {SERVING.astrologerLabel}
                    </GeoLink>
                    <GeoLink href={locationHref(location, "vastu-consultant")} name={location.name}>
                      {SERVING.vastuLabel}
                    </GeoLink>
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

/**
 * A geo link in either register. The underline is a gold hairline that only appears on hover
 * or focus, so a list of twenty of them is quiet until it is used; `min-h-11` keeps the tap
 * target honest on a phone without adding a visible box.
 */
function GeoLink({
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
      className="inline-flex min-h-11 items-center text-accent-strong no-underline decoration-accent-border/70 underline-offset-[5px] hover:underline focus-visible:underline"
    >
      {children}
      <span className="sr-only"> in {name}</span>
    </Link>
  );
}
