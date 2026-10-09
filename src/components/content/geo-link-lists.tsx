import Link from "next/link";
import { locationHref, type Location } from "@/lib/data";
import type { GeoService } from "@/lib/data/types";
import { DoorField } from "./doors";
import type { DoorMotif } from "./motif-sprite";

const SERVICE_MOTIF: Record<GeoService, DoorMotif> = {
  astrologer: "north-chart",
  "vastu-consultant": "compass",
};

/**
 * Country doors and a two-column city list into one geo family (`/astrologer/…` or
 * `/vastu-consultant/…`), so a hub page is one click from every published country and
 * featured city (CLAUDE.md §5). Pass only publishable locations — never a link to a 404. The
 * page renders `MotifSprite` once for the country glyphs.
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
  const h3 =
    "mb-5 font-display text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase";
  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      {countries.length > 0 ? (
        <div>
          <h3 className={h3}>{headings.countries}</h3>
          <DoorField
            variant="tile"
            columns={2}
            doors={countries.map((loc) => ({
              href: locationHref(loc, service),
              label: loc.shortName ?? loc.name,
              line: linkLabel(loc.name),
              motif: SERVICE_MOTIF[service],
            }))}
          />
        </div>
      ) : null}
      {cities.length > 0 ? (
        <div>
          <h3 className={h3}>{headings.cities}</h3>
          <ul className="grid gap-x-12 sm:grid-cols-2">
            {cities.map((loc) => (
              <li key={loc.path}>
                <Link
                  href={locationHref(loc, service)}
                  className="group flex min-h-12 items-center justify-between gap-4 border-t border-border py-2 font-serif text-base no-underline transition-colors duration-(--duration-base) hover:border-accent-border/60 hover:text-accent-strong"
                >
                  <span>{linkLabel(loc.shortName ?? loc.name)}</span>
                  <span
                    aria-hidden="true"
                    className="text-accent-strong transition-transform duration-(--duration-base) ease-emphasized group-hover:translate-x-1 motion-reduce:transition-none"
                  >
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
