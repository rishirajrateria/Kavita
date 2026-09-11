/**
 * Internal-linking engine for geo pages (CLAUDE.md §5): every page links UP to its parent,
 * SIDEWAYS to 4–6 siblings, ACROSS to its astrology/vastu counterpart and DOWN to its children.
 * Computed from the location tree — never hand-maintained — and only ever to publishable
 * locations, so no template can link to a 404.
 */
import { isPublishable, type LocationRecord } from "@/content/locations/schema";
import { getPublishableLocations, locationHref } from "@/lib/data/locations";
import type { GeoService } from "@/lib/data/types";
import { GEO_SERVICE_META } from "./service";

export const SIBLING_MIN = 4;
export const SIBLING_MAX = 6;
/** Children rendered as cards; any remainder is still linked in a compact list (no orphans). */
export const CHILD_CARD_CAP = 24;

export interface LinkGraph {
  /** Nearest publishable ancestor, or null for a country. */
  parent: LocationRecord | null;
  /** Every publishable ancestor, root first — the breadcrumb trail. */
  ancestors: LocationRecord[];
  /** 4–6 publishable locations of the same tier: same parent first, then same country, then featured. */
  siblings: LocationRecord[];
  /** The same place in the other family. */
  counterpart: { service: GeoService; href: string; label: string };
  /**
   * Nearest publishable descendants, featured first: direct children where they are published,
   * otherwise the publishable places beneath an unpublished child (a country whose states are
   * still stubs links straight to its cities), so nothing below is ever orphaned.
   */
  children: LocationRecord[];
  /** The service's hrefs for convenience. */
  href: (loc: LocationRecord) => string;
}

const TIER_RANK = { mega: 0, large: 1, medium: 2, small: 3 } as const;

/** Featured first, then population tier, then name. */
export function sortForDisplay(list: readonly LocationRecord[]): LocationRecord[] {
  return [...list].sort(
    (a, b) =>
      Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
      TIER_RANK[a.populationTier] - TIER_RANK[b.populationTier] ||
      a.name.localeCompare(b.name, "en"),
  );
}

/** Pick up to `max` siblings: same parent, then same country, then featured anywhere. */
export function pickSiblings(
  loc: LocationRecord,
  pool: readonly LocationRecord[],
  max = SIBLING_MAX,
): LocationRecord[] {
  const candidates = pool.filter(
    (l) => l.type === loc.type && l.path !== loc.path && isPublishable(l),
  );
  const seen = new Set<string>();
  const out: LocationRecord[] = [];
  const take = (group: LocationRecord[]) => {
    for (const l of sortForDisplay(group)) {
      if (out.length >= max) return;
      if (seen.has(l.path)) continue;
      seen.add(l.path);
      out.push(l);
    }
  };
  take(candidates.filter((l) => l.parentPath === loc.parentPath));
  take(candidates.filter((l) => l.countryCode === loc.countryCode));
  take(candidates.filter((l) => l.isFeatured));
  take(candidates);
  return out;
}

/** Publishable descendants whose every ancestor between them and `loc` is NOT publishable. */
export function nearestPublishableDescendants(
  loc: LocationRecord,
  pool: readonly LocationRecord[],
  byPath: ReadonlyMap<string, LocationRecord>,
): LocationRecord[] {
  const prefix = `${loc.path}/`;
  return pool.filter((l) => {
    if (!l.path.startsWith(prefix)) return false;
    let parent = l.parentPath;
    while (parent && parent !== loc.path) {
      if (byPath.has(parent)) return false; // a published ancestor links to it instead
      parent = parent.split("/").slice(0, -1).join("/") || null;
    }
    return true;
  });
}

export async function getLinkGraph(loc: LocationRecord, service: GeoService): Promise<LinkGraph> {
  const pool = await getPublishableLocations();
  const byPath = new Map(pool.map((l) => [l.path, l] as const));
  const href = (l: LocationRecord) => locationHref(l, service);

  const segments = loc.path.split("/");
  const ancestors: LocationRecord[] = [];
  for (let depth = 1; depth < segments.length; depth += 1) {
    const found = byPath.get(segments.slice(0, depth).join("/"));
    if (found) ancestors.push(found);
  }

  const counterpartService = GEO_SERVICE_META[service].counterpart;
  return {
    parent: ancestors[ancestors.length - 1] ?? null,
    ancestors,
    siblings: pickSiblings(loc, pool),
    counterpart: {
      service: counterpartService,
      href: locationHref(loc, counterpartService),
      label: `${GEO_SERVICE_META[counterpartService].label} in ${loc.name}`,
    },
    children: sortForDisplay(nearestPublishableDescendants(loc, pool, byPath)),
    href,
  };
}
