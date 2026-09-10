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
 */
export function Serving({ countries, cities }: { countries: Location[]; cities: Location[] }) {
  return (
    <Section id={SERVING.id} spacing="md">
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={SERVING} />

        <div className="grid gap-10 lg:grid-cols-2">
          <LocationList heading={SERVING.countriesHeading} locations={countries} />
          <LocationList heading={SERVING.citiesHeading} locations={cities} />
        </div>

        <p className="text-sm text-muted-foreground">
          Hubs:{" "}
          <Link href="/astrology" className="text-accent-strong underline">
            Vedic astrology
          </Link>
          {" · "}
          <Link href="/vastu" className="text-accent-strong underline">
            Vastu consultation
          </Link>
        </p>
      </Container>
    </Section>
  );
}

function LocationList({ heading, locations }: { heading: string; locations: Location[] }) {
  if (locations.length === 0) return null;
  return (
    <div>
      <Heading as="h3" level={4} className="mb-4">
        {heading}
      </Heading>
      <ul className="divide-y divide-accent-border/40 border-y border-accent-border/40">
        {locations.map((location) => (
          <li
            key={location.path}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
          >
            <span className="font-medium">{location.name}</span>
            <span className="flex gap-4 text-sm">
              <Link
                href={locationHref(location, "astrologer")}
                className="text-accent-strong underline-offset-4 hover:underline"
              >
                {SERVING.astrologerLabel}
                <span className="sr-only"> in {location.name}</span>
              </Link>
              <Link
                href={locationHref(location, "vastu-consultant")}
                className="text-accent-strong underline-offset-4 hover:underline"
              >
                {SERVING.vastuLabel}
                <span className="sr-only"> in {location.name}</span>
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
