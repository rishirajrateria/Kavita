/**
 * Registry of the hand-written core routes (CLAUDE.md §5) and the single `isIndexable()` rule
 * shared by the sitemaps, robots.txt, llms.txt and the markdown mirror.
 *
 * `exists` says whether the route is built yet: Phase 3 flips the content pages to `true` as
 * they land. Sitemaps and llms.txt list a route only when it both exists AND is indexable, so a
 * link to a 404 can never reach a crawler.
 */
import { ROUTE_DATES } from "@/content/route-dates";

export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface CoreRoute {
  path: string;
  /** Human label for llms.txt and the for-ai page. */
  label: string;
  exists: boolean;
  indexable: boolean;
  priority: number;
  changefreq: ChangeFreq;
  /** `YYYY-MM-DD` from `src/content/route-dates.ts`; absent when the route has no recorded date. */
  lastmod?: string;
}

/** Path prefixes that are never indexable, whatever the registry says. */
const NEVER_INDEXABLE_PREFIXES = ["/admin", "/api", "/_next", "/design-system", "/book"] as const;

/** True when `path` may appear in sitemaps, llms.txt and be crawled for indexing. */
export function isIndexable(path: string): boolean {
  const normalised = normalisePath(path);
  return !NEVER_INDEXABLE_PREFIXES.some(
    (prefix) => normalised === prefix || normalised.startsWith(`${prefix}/`),
  );
}

/** `/about/` → `/about`; `about` → `/about`; strips query and hash. */
export function normalisePath(path: string): string {
  let p = path.split(/[?#]/)[0] ?? "";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

type RouteSpec = Omit<CoreRoute, "lastmod" | "indexable"> & { indexable?: boolean };

const define = (spec: RouteSpec): CoreRoute => ({
  ...spec,
  indexable: spec.indexable ?? isIndexable(spec.path),
  lastmod: ROUTE_DATES[spec.path],
});

/**
 * Every core route in CLAUDE.md §5, in site-map order. `exists` is the only field that changes
 * between phases; everything else is fixed by the brief.
 */
export const CORE_ROUTES: readonly CoreRoute[] = [
  define({ path: "/", label: "Home", exists: true, priority: 1.0, changefreq: "weekly" }),
  define({
    path: "/about",
    label: "About Astrologer Kavita",
    exists: false,
    priority: 0.9,
    changefreq: "monthly",
  }),
  define({
    path: "/astrology",
    label: "Vedic astrology",
    exists: false,
    priority: 0.9,
    changefreq: "monthly",
  }),
  define({
    path: "/vastu",
    label: "Vastu shastra",
    exists: false,
    priority: 0.9,
    changefreq: "monthly",
  }),
  define({
    path: "/services",
    label: "Services",
    exists: false,
    priority: 0.9,
    changefreq: "monthly",
  }),
  define({ path: "/learn", label: "Learn", exists: false, priority: 0.8, changefreq: "weekly" }),
  define({
    path: "/testimonials",
    label: "Client experiences",
    exists: false,
    priority: 0.6,
    changefreq: "monthly",
  }),
  define({
    path: "/book",
    label: "Book a consultation",
    exists: false,
    priority: 0.5,
    changefreq: "monthly",
  }),
  define({
    path: "/contact",
    label: "Contact",
    exists: false,
    priority: 0.7,
    changefreq: "yearly",
  }),
  define({
    path: "/faq",
    label: "Frequently asked questions",
    exists: false,
    priority: 0.7,
    changefreq: "monthly",
  }),
  define({
    path: "/for-ai",
    label: "Factual summary for AI assistants",
    exists: true,
    priority: 0.5,
    changefreq: "monthly",
  }),
  define({
    path: "/privacy",
    label: "Privacy policy",
    exists: false,
    priority: 0.2,
    changefreq: "yearly",
  }),
  define({
    path: "/terms",
    label: "Terms of service",
    exists: false,
    priority: 0.2,
    changefreq: "yearly",
  }),
  define({
    path: "/disclaimer",
    label: "Disclaimer",
    exists: false,
    priority: 0.3,
    changefreq: "yearly",
  }),
];

/** Routes that are built and may be crawled — the input of `/sitemap-pages.xml` and `llms.txt`. */
export function listIndexableCoreRoutes(): CoreRoute[] {
  return CORE_ROUTES.filter((r) => r.exists && r.indexable);
}

export function getCoreRoute(path: string): CoreRoute | undefined {
  const p = normalisePath(path);
  return CORE_ROUTES.find((r) => r.path === p);
}
