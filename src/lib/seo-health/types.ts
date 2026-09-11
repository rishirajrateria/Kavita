/**
 * SEO health finding vocabulary (Phase 6, P6-D). Every finding type carries a fixed severity, a
 * human label and a short explanation so the dashboard, the crawler and the tests share one
 * list. `fixFor()` in `./fix-links.ts` maps a finding to the admin editor that resolves it.
 */
import type { SeoFindingSeverity } from "@/db/schema/seo-health";

export type { SeoCrawlPageRecord, SeoCrawlState, SeoCrawlSummary } from "@/db/schema/seo-health";

export const SEO_FINDING_TYPES = {
  http_error: { severity: "error", label: "Page error", hint: "The page answered 4xx or 5xx." },
  title_missing: { severity: "error", label: "Missing title", hint: "No <title> element." },
  title_length: {
    severity: "warning",
    label: "Title length",
    hint: "Titles read best between 30 and 60 characters (CLAUDE.md §8).",
  },
  title_duplicate: {
    severity: "warning",
    label: "Duplicate title",
    hint: "Two or more pages share the same <title>.",
  },
  description_missing: {
    severity: "warning",
    label: "Missing description",
    hint: 'No <meta name="description">.',
  },
  description_length: {
    severity: "warning",
    label: "Description length",
    hint: "Meta descriptions should run 120–160 characters.",
  },
  description_duplicate: {
    severity: "warning",
    label: "Duplicate description",
    hint: "Two or more pages share the same meta description.",
  },
  h1_missing: { severity: "error", label: "No H1", hint: "Every page needs exactly one H1." },
  h1_multiple: {
    severity: "warning",
    label: "Multiple H1s",
    hint: "More than one H1 dilutes the page's primary keyword.",
  },
  broken_link: {
    severity: "error",
    label: "Broken internal link",
    hint: "A link on this page leads to a 404 or a server error.",
  },
  image_alt_missing: {
    severity: "warning",
    label: "Image without alt",
    hint: "An <img> has no alt attribute (empty alt is fine for decoration).",
  },
  jsonld_missing: {
    severity: "warning",
    label: "No structured data",
    hint: "No JSON-LD block was found on the page.",
  },
  jsonld_invalid: {
    severity: "error",
    label: "Invalid JSON-LD",
    hint: "A JSON-LD block does not parse.",
  },
  faqpage_missing: {
    severity: "warning",
    label: "No FAQPage schema",
    hint: "Geo and service pages carry an FAQ block with FAQPage JSON-LD (CLAUDE.md §8).",
  },
  thin_content: {
    severity: "warning",
    label: "Thin content",
    hint: "Under 700 words on a geo page, or under 300 elsewhere.",
  },
  citability_low: {
    severity: "warning",
    label: "Low citability",
    hint: "The page scores under the citability threshold for answer engines (CLAUDE.md §9).",
  },
  canonical_mismatch: {
    severity: "warning",
    label: "Canonical mismatch",
    hint: "The canonical URL points somewhere other than the page itself.",
  },
  noindex_in_sitemap: {
    severity: "error",
    label: "Noindex page in sitemap",
    hint: "The sitemap lists a page that asks not to be indexed.",
  },
  not_in_sitemap: {
    severity: "warning",
    label: "Not in sitemap",
    hint: "An indexable page that no sitemap lists.",
  },
  orphan_page: {
    severity: "warning",
    label: "Orphan page",
    hint: "Listed in a sitemap but never linked from any crawled page.",
  },
  redirect_chain: {
    severity: "warning",
    label: "Redirect chain",
    hint: "Reaching the page takes more than one redirect hop.",
  },
  redirect_loop: {
    severity: "error",
    label: "Redirect loop or too long",
    hint: "The redirects loop or exceed five hops.",
  },
  link_to_redirect: {
    severity: "info",
    label: "Link via redirect",
    hint: "Pages link to a URL that redirects; link to the final URL instead.",
  },
} as const satisfies Record<string, { severity: SeoFindingSeverity; label: string; hint: string }>;

export type SeoFindingType = keyof typeof SEO_FINDING_TYPES;

export const SEO_FINDING_TYPE_LIST = Object.keys(SEO_FINDING_TYPES) as SeoFindingType[];

export function isSeoFindingType(value: string): value is SeoFindingType {
  return Object.hasOwn(SEO_FINDING_TYPES, value);
}

/** One problem on one path. `fixHref` is filled by `fixFor()` before storage. */
export interface Finding {
  path: string;
  type: SeoFindingType;
  severity: SeoFindingSeverity;
  message: string;
  details?: Record<string, unknown>;
  fixHref?: string | null;
}

export function finding(
  path: string,
  type: SeoFindingType,
  message: string,
  details?: Record<string, unknown>,
): Finding {
  return { path, type, severity: SEO_FINDING_TYPES[type].severity, message, details };
}

/** What the parser extracts from one HTML document. */
export interface ParsedPage {
  title: string | null;
  description: string | null;
  canonical: string | null;
  /** `noindex` in `<meta name="robots">` (or `googlebot`). */
  noindex: boolean;
  h1Count: number;
  h1: string | null;
  /** Same-origin link targets, normalised to paths (query and hash stripped), de-duplicated. */
  links: string[];
  /** Hrefs that were skipped as external or non-page (mailto, tel, files). */
  imagesWithoutAlt: number;
  jsonLdTypes: string[];
  jsonLdInvalid: number;
  /** Words in `<main>` (or the body when there is no main), chrome excluded. */
  words: number;
}

/** Word floors per page family (CLAUDE.md §7 for geo pages; a lower bar elsewhere). */
export const THIN_WORDS = { geo: 700, other: 300 } as const;

/** Citability score (0–100) under which `citability_low` is raised. */
export const CITABILITY_THRESHOLD = 60;

export const TITLE_LENGTH = { min: 30, max: 60 } as const;
export const DESCRIPTION_LENGTH = { min: 120, max: 160 } as const;

/** Hard ceilings for one crawl. */
export const CRAWL_LIMITS = { maxPages: 2000, concurrency: 4, maxRedirectHops: 5 } as const;

export function isGeoPath(path: string): boolean {
  return path.startsWith("/astrologer/") || path.startsWith("/vastu-consultant/");
}

export function isServicePath(path: string): boolean {
  return path.startsWith("/services/");
}
