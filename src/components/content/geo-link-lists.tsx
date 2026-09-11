import Link from "next/link";
import { Heading } from "@/components/ui/heading";
import { locationHref, type Location } from "@/lib/data";
import type { GeoService } from "@/lib/data/types";

/**
 * Country pills and a two-column city list into one geo family (`/astrologer/…` or
 * `/vastu-consultant/…`), so a hub page is one click from every published country and
 * featured city (CLAUDE.md §5). Pass only publishable locations — never a link to a 404.
 */
export function GeoLinkLists({
  service,
  countries,
  cities,
  linkLabel,
  headings = { countries: "By country", cities: "By city" },
}: {
  service: GeoService;
  countries: Location[];
  cities: Location[];
  linkLabel: (name: string) => string;
  headings?: { countries: string; cities: string };
}) {
  if (countries.length === 0 && cities.length === 0) return null;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
      {countries.length > 0 ? (
        <div>
          <Heading as="h3" level={5} className="mb-5 text-accent-strong">
            {headings.countries}
          </Heading>
          <ul className="flex flex-wrap gap-3">
            {countries.map((loc) => (
              <li key={loc.path}>
                <Link
                  href={locationHref(loc, service)}
                  className="inline-flex min-h-11 items-center rounded-full border border-accent-border/50 px-5 font-serif text-base text-foreground no-underline transition-colors hover:border-accent-border hover:bg-accent/60"
                >
                  {linkLabel(loc.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {cities.length > 0 ? (
        <div>
          <Heading as="h3" level={5} className="mb-4 text-accent-strong">
            {headings.cities}
          </Heading>
          <ul className="grid gap-x-10 border-t border-border sm:grid-cols-2">
            {cities.map((loc) => (
              <li key={loc.path} className="border-b border-border">
                <Link
                  href={locationHref(loc, service)}
                  className="flex min-h-11 items-center justify-between gap-4 py-1.5 no-underline hover:text-accent-strong"
                >
                  <span className="font-medium">{linkLabel(loc.shortName ?? loc.name)}</span>
                  <span aria-hidden="true" className="text-accent-strong">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
