import { HUB } from "@/content/home";

/** One house of the kundli hub: number, significator, label, meaning and destination. */
export type HubHouse = (typeof HUB.houses)[number];

function normalise(href: string): string {
  const path = href.split(/[?#]/, 1)[0] ?? href;
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * The house of the chart that opens `href`, if any — so a door's planet is always derived from
 * the hub mapping (`HUB.houses`, CLAUDE.md §4) and never assigned by hand. Pages outside the
 * hub (a city, a glossary term) get no house and therefore no planet.
 */
export function hubHouseFor(href: string | undefined): HubHouse | undefined {
  if (!href) return undefined;
  const path = normalise(href);
  return HUB.houses.find((h) => h.href === path);
}
