/**
 * Where each SEO health finding is fixed (Phase 6, P6-D). One table, so the dashboard's "Fix"
 * column always lands on the admin editor that owns the problem:
 *
 *   page_seo editor   `/admin/seo/<route>`        titles, descriptions, H1, canonical, JSON-LD
 *   AEO panel         `/admin/aeo?route=<route>`  citability
 *   redirects         `/admin/redirects?prefill=` broken links, 404s, chains
 *   sitemaps          `/admin/sitemaps`           sitemap membership, orphans
 *   FAQ manager       `/admin/faqs`               missing FAQPage schema
 *   locations editor  `/admin/content/locations/<path>`  thin geo pages (research fields)
 */
import { isGeoPath, type Finding, type SeoFindingType } from "./types";

/** `/astrologer/india/maharashtra/mumbai` → `/admin/seo/astrologer/india/maharashtra/mumbai`. */
export function seoEditorHref(path: string): string {
  return path === "/" ? "/admin/seo/home" : `/admin/seo${path}`;
}

export function redirectPrefillHref(fromPath: string, toPath?: string): string {
  const params = new URLSearchParams({ prefill: fromPath });
  if (toPath) params.set("to", toPath);
  return `/admin/redirects?${params.toString()}`;
}

function geoLocationEditorHref(path: string): string | null {
  const m = /^\/(astrologer|vastu-consultant)\/(.+)$/.exec(path);
  return m ? `/admin/content/locations/${m[2]}` : null;
}

const FIX: Record<SeoFindingType, (f: Finding) => string | null> = {
  http_error: (f) => redirectPrefillHref(f.path),
  title_missing: (f) => seoEditorHref(f.path),
  title_length: (f) => seoEditorHref(f.path),
  title_duplicate: (f) => seoEditorHref(f.path),
  description_missing: (f) => seoEditorHref(f.path),
  description_length: (f) => seoEditorHref(f.path),
  description_duplicate: (f) => seoEditorHref(f.path),
  h1_missing: (f) => seoEditorHref(f.path),
  h1_multiple: (f) => seoEditorHref(f.path),
  broken_link: (f) => {
    const href = typeof f.details?.href === "string" ? f.details.href : f.path;
    return redirectPrefillHref(href);
  },
  image_alt_missing: (f) => geoLocationEditorHref(f.path) ?? seoEditorHref(f.path),
  jsonld_missing: (f) => seoEditorHref(f.path),
  jsonld_invalid: (f) => seoEditorHref(f.path),
  faqpage_missing: () => "/admin/faqs",
  thin_content: (f) => (isGeoPath(f.path) ? geoLocationEditorHref(f.path) : seoEditorHref(f.path)),
  citability_low: (f) => `/admin/aeo?route=${encodeURIComponent(f.path)}`,
  canonical_mismatch: (f) => seoEditorHref(f.path),
  noindex_in_sitemap: () => "/admin/sitemaps",
  not_in_sitemap: () => "/admin/sitemaps",
  orphan_page: () => "/admin/sitemaps",
  redirect_chain: (f) => {
    const final = typeof f.details?.final === "string" ? f.details.final : undefined;
    return redirectPrefillHref(f.path, final);
  },
  redirect_loop: (f) => redirectPrefillHref(f.path),
  link_to_redirect: (f) => seoEditorHref(f.path),
};

/** The admin route that fixes `finding`, or `null` when the fix lives in code. */
export function fixFor(finding: Finding): string | null {
  return FIX[finding.type](finding);
}

/** Attach `fixHref` to every finding (in place, returned for chaining). */
export function withFixes(findings: Finding[]): Finding[] {
  for (const f of findings) f.fixHref = fixFor(f);
  return findings;
}
