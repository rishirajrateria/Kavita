/**
 * The SEO health checks (Phase 6, P6-D). `pageFindings()` runs on one fetched page; `crossPageFindings()`
 * runs once at the end of a crawl over the recorded page map (duplicates, broken links, sitemap
 * cross-checks, orphans, redirect links). Pure: the crawler feeds them, the tests call them directly.
 */
import type { SeoCrawlPageRecord, SeoCrawlState } from "@/db/schema/seo-health";
import { isIndexable } from "@/lib/routes";
import {
  CITABILITY_THRESHOLD,
  DESCRIPTION_LENGTH,
  finding,
  isGeoPath,
  isServicePath,
  THIN_WORDS,
  TITLE_LENGTH,
  type Finding,
  type ParsedPage,
} from "./types";

export interface PageCheckInput {
  path: string;
  origin: string;
  status: number;
  /** Redirect hops followed before the final response (0 = none). */
  hops: string[];
  /** `true` when the redirects looped or exceeded the hop limit. */
  redirectFailed: boolean;
  parsed: ParsedPage | null;
  /** 0–100 when the citability scorer ran, else `null`. */
  citability: { score: number; fixes: string[] } | null;
}

function sameUrl(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const strip = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);
    return ua.origin === ub.origin && strip(ua.pathname) === strip(ub.pathname);
  } catch {
    return false;
  }
}

/** Findings for one page. Redirect problems are attributed to the requested path. */
export function pageFindings(input: PageCheckInput): Finding[] {
  const { path, status, hops, parsed } = input;
  const out: Finding[] = [];

  if (input.redirectFailed) {
    out.push(
      finding(path, "redirect_loop", `Redirects from ${path} loop or exceed 5 hops.`, { hops }),
    );
    return out;
  }
  if (hops.length >= 2) {
    out.push(
      finding(
        path,
        "redirect_chain",
        `${path} reaches its target through ${hops.length} redirects.`,
        {
          hops,
          final: hops[hops.length - 1],
        },
      ),
    );
  }
  if (status >= 400 || status === 0) {
    out.push(
      finding(
        path,
        "http_error",
        status === 0 ? `${path} could not be fetched.` : `${path} answered HTTP ${status}.`,
        { status },
      ),
    );
    return out;
  }
  if (!parsed) return out;

  // Title
  if (!parsed.title) out.push(finding(path, "title_missing", `${path} has no <title>.`));
  else if (parsed.title.length < TITLE_LENGTH.min || parsed.title.length > TITLE_LENGTH.max) {
    out.push(
      finding(
        path,
        "title_length",
        `Title is ${parsed.title.length} characters (aim for ${TITLE_LENGTH.min}–${TITLE_LENGTH.max}).`,
        { length: parsed.title.length, title: parsed.title },
      ),
    );
  }

  // Meta description
  if (!parsed.description) {
    out.push(finding(path, "description_missing", `${path} has no meta description.`));
  } else if (
    parsed.description.length < DESCRIPTION_LENGTH.min ||
    parsed.description.length > DESCRIPTION_LENGTH.max
  ) {
    out.push(
      finding(
        path,
        "description_length",
        `Meta description is ${parsed.description.length} characters (aim for ${DESCRIPTION_LENGTH.min}–${DESCRIPTION_LENGTH.max}).`,
        { length: parsed.description.length },
      ),
    );
  }

  // H1
  if (parsed.h1Count === 0) out.push(finding(path, "h1_missing", `${path} has no H1.`));
  else if (parsed.h1Count > 1) {
    out.push(
      finding(path, "h1_multiple", `${path} has ${parsed.h1Count} H1 headings.`, {
        count: parsed.h1Count,
      }),
    );
  }

  // Images
  if (parsed.imagesWithoutAlt > 0) {
    out.push(
      finding(
        path,
        "image_alt_missing",
        `${parsed.imagesWithoutAlt} image${parsed.imagesWithoutAlt === 1 ? "" : "s"} without an alt attribute.`,
        { count: parsed.imagesWithoutAlt },
      ),
    );
  }

  // Structured data
  if (parsed.jsonLdInvalid > 0) {
    out.push(
      finding(path, "jsonld_invalid", `${parsed.jsonLdInvalid} JSON-LD block(s) do not parse.`, {
        count: parsed.jsonLdInvalid,
      }),
    );
  }
  if (parsed.jsonLdTypes.length === 0 && parsed.jsonLdInvalid === 0) {
    out.push(finding(path, "jsonld_missing", `${path} carries no JSON-LD.`));
  } else if ((isGeoPath(path) || isServicePath(path)) && !parsed.jsonLdTypes.includes("FAQPage")) {
    out.push(
      finding(path, "faqpage_missing", `${path} has no FAQPage schema.`, {
        types: parsed.jsonLdTypes,
      }),
    );
  }

  // Canonical
  if (parsed.canonical && !sameUrl(parsed.canonical, `${input.origin}${path}`)) {
    out.push(
      finding(path, "canonical_mismatch", `Canonical points to ${parsed.canonical}.`, {
        canonical: parsed.canonical,
      }),
    );
  }

  // Word count (only indexable, non-noindex pages are held to the floor)
  const floor = isGeoPath(path) ? THIN_WORDS.geo : THIN_WORDS.other;
  if (isIndexable(path) && !parsed.noindex && parsed.words < floor) {
    out.push(
      finding(path, "thin_content", `${parsed.words} words on the page (floor ${floor}).`, {
        words: parsed.words,
        floor,
      }),
    );
  }

  // Citability (P6-A scorer), when available
  if (input.citability && input.citability.score < CITABILITY_THRESHOLD) {
    out.push(
      finding(
        path,
        "citability_low",
        `Citability score ${input.citability.score}/100 (threshold ${CITABILITY_THRESHOLD}).`,
        { score: input.citability.score, fixes: input.citability.fixes.slice(0, 6) },
      ),
    );
  }

  return out;
}

function groupDuplicates(
  pages: Record<string, SeoCrawlPageRecord>,
  pick: (p: SeoCrawlPageRecord) => string | null,
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const [path, page] of Object.entries(pages)) {
    if (page.status !== 200 || !page.html || page.redirectedTo) continue;
    const value = pick(page)?.trim().toLowerCase();
    if (!value) continue;
    const list = groups.get(value) ?? [];
    list.push(path);
    groups.set(value, list);
  }
  return groups;
}

/** Findings that need the whole crawl: duplicates, broken links, sitemap checks, orphans. */
export function crossPageFindings(state: SeoCrawlState): Finding[] {
  const out: Finding[] = [];
  const { pages } = state;
  const sitemap = new Set(state.sitemapPaths);

  for (const [value, paths] of groupDuplicates(pages, (p) => p.title)) {
    if (paths.length < 2) continue;
    for (const path of paths) {
      out.push(
        finding(path, "title_duplicate", `Title shared with ${paths.length - 1} other page(s).`, {
          title: value,
          also: paths.filter((p) => p !== path).slice(0, 10),
        }),
      );
    }
  }
  for (const [, paths] of groupDuplicates(pages, (p) => p.description)) {
    if (paths.length < 2) continue;
    for (const path of paths) {
      out.push(
        finding(
          path,
          "description_duplicate",
          `Meta description shared with ${paths.length - 1} other page(s).`,
          { also: paths.filter((p) => p !== path).slice(0, 10) },
        ),
      );
    }
  }

  // Inbound link map + broken/redirecting link targets.
  const inbound = new Map<string, string[]>();
  for (const [path, page] of Object.entries(pages)) {
    if (page.status !== 200 || !page.html) continue;
    for (const target of page.links) {
      const list = inbound.get(target) ?? [];
      list.push(path);
      inbound.set(target, list);
      const hit = pages[target];
      if (!hit) continue;
      if (hit.status >= 400 || hit.status === 0) {
        out.push(
          finding(path, "broken_link", `Links to ${target}, which answers HTTP ${hit.status}.`, {
            href: target,
            status: hit.status,
          }),
        );
      }
    }
  }
  for (const [target, page] of Object.entries(pages)) {
    if (!page.redirectedTo) continue;
    const linkers = inbound.get(target);
    if (!linkers || linkers.length === 0) continue;
    out.push(
      finding(
        target,
        "link_to_redirect",
        `${linkers.length} page(s) link to ${target}, which redirects to ${page.redirectedTo}.`,
        { redirectsTo: page.redirectedTo, linkedFrom: linkers.slice(0, 10) },
      ),
    );
  }

  // Sitemap cross-checks.
  for (const [path, page] of Object.entries(pages)) {
    if (page.status !== 200 || !page.html || page.redirectedTo) continue;
    if (sitemap.has(path)) {
      if (page.noindex) {
        out.push(
          finding(path, "noindex_in_sitemap", `${path} is noindex but listed in a sitemap.`),
        );
      }
    } else if (isIndexable(path) && !page.noindex && state.sitemapPaths.length > 0) {
      out.push(finding(path, "not_in_sitemap", `${path} is indexable but in no sitemap.`));
    }
  }
  for (const path of state.sitemapPaths) {
    if (path === "/") continue;
    const linkers = inbound.get(path);
    if (!linkers || linkers.length === 0) {
      out.push(
        finding(path, "orphan_page", `${path} is in the sitemap but no crawled page links to it.`),
      );
    }
  }
  return out;
}
