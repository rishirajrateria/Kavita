/**
 * Sitemap generators (CLAUDE.md §8 "Crawl & indexing"). Pure functions the `/sitemap*.xml`
 * route handlers call, unit-tested in `tests/seo-plumbing/sitemaps.test.ts`.
 *
 *   /sitemap.xml                    index → every file below (+ overflow files)
 *   /sitemap-pages.xml              core routes that exist and are indexable
 *   /sitemap-geo-astrology.xml      geo pages with status `complete`, ≤ 5,000 per file
 *   /sitemap-geo-astrology-2.xml    overflow (proxy rewrite → `src/app/api/sitemaps/[family]/[page]`)
 *   /sitemap-geo-vastu.xml, -2.xml
 *   /sitemap-learn.xml              empty urlset until Phase 3
 *   /sitemap-images.xml             practitioner photo + OG images once real ones exist
 *
 * `lastmod` always comes from content dates (`route-dates.ts`, `contentUpdatedAt`) — never
 * `new Date()`.
 */
import { HERO } from "@/content/home";
import type { GeoService } from "@/lib/data/types";
import { listGeoPages } from "@/lib/geo/pages";
import { type ChangeFreq, listIndexableCoreRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

/** Sitemap protocol maximum per file (the brief caps at 5,000; the protocol at 50,000). */
export const SITEMAP_MAX_URLS = 5000;

export interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: number;
  images?: SitemapImage[];
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

export interface GeoSitemapFamily {
  service: GeoService;
  /** File stem: `sitemap-geo-astrology`. */
  stem: string;
}

export const GEO_SITEMAP_FAMILIES = {
  astrology: { service: "astrologer", stem: "sitemap-geo-astrology" },
  vastu: { service: "vastu-consultant", stem: "sitemap-geo-vastu" },
} as const satisfies Record<string, GeoSitemapFamily>;

// --- XML helpers -------------------------------------------------------------------------------

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1";

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.+-]+Z?)?$/;

/** Reject malformed dates so a typo in a record can never emit an invalid sitemap. */
function lastmodTag(lastmod: string | undefined): string {
  return lastmod && DATE_RE.test(lastmod) ? `<lastmod>${lastmod}</lastmod>` : "";
}

function imageTags(images: SitemapImage[] | undefined): string {
  if (!images || images.length === 0) return "";
  return images
    .map(
      (img) =>
        `<image:image><image:loc>${escapeXml(img.loc)}</image:loc>` +
        (img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : "") +
        (img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : "") +
        `</image:image>`,
    )
    .join("");
}

/** Render a `<urlset>`; entries beyond `SITEMAP_MAX_URLS` are dropped (callers chunk first). */
export function renderUrlset(entries: readonly SitemapEntry[]): string {
  const hasImages = entries.some((e) => e.images && e.images.length > 0);
  const open = `<urlset xmlns="${NS}"${hasImages ? ` xmlns:image="${IMAGE_NS}"` : ""}>`;
  const body = entries
    .slice(0, SITEMAP_MAX_URLS)
    .map(
      (e) =>
        `<url><loc>${escapeXml(e.loc)}</loc>` +
        lastmodTag(e.lastmod) +
        (e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : "") +
        (e.priority !== undefined ? `<priority>${e.priority.toFixed(1)}</priority>` : "") +
        imageTags(e.images) +
        `</url>`,
    )
    .join("\n");
  return `${XML_HEADER}\n${open}\n${body}${body ? "\n" : ""}</urlset>\n`;
}

export function renderSitemapIndex(entries: readonly SitemapIndexEntry[]): string {
  const body = entries
    .map((e) => `<sitemap><loc>${escapeXml(e.loc)}</loc>${lastmodTag(e.lastmod)}</sitemap>`)
    .join("\n");
  return `${XML_HEADER}\n<sitemapindex xmlns="${NS}">\n${body}${body ? "\n" : ""}</sitemapindex>\n`;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Latest `YYYY-MM-DD` among entries, for the index's `lastmod`. */
export function latestLastmod(entries: readonly { lastmod?: string }[]): string | undefined {
  let latest: string | undefined;
  for (const e of entries) {
    if (e.lastmod && DATE_RE.test(e.lastmod) && (!latest || e.lastmod > latest)) latest = e.lastmod;
  }
  return latest;
}

/** Overflow file name: page 1 is the bare stem, page 2+ gets `-<n>`. */
export function sitemapFileName(stem: string, page: number): string {
  return page <= 1 ? `/${stem}.xml` : `/${stem}-${page}.xml`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

// --- entry sources ---------------------------------------------------------------------------

/** Core routes that exist and are indexable, with their recorded dates. */
export function pagesSitemapEntries(): SitemapEntry[] {
  // The home page is listed as `https://site/` (trailing slash), as the sitemap protocol expects.
  return listIndexableCoreRoutes().map((r) => ({
    loc: r.path === "/" ? `${absoluteUrl("/")}/` : absoluteUrl(r.path),
    lastmod: r.lastmod,
    changefreq: r.changefreq,
    priority: r.priority,
  }));
}

/** Only `complete` geo pages (CLAUDE.md §7: partial pages are noindex, stubs 404). */
export async function geoSitemapEntries(service: GeoService): Promise<SitemapEntry[]> {
  const pages = await listGeoPages();
  return pages
    .filter((p) => p.service === service && p.status === "complete")
    .map((p) => ({
      loc: absoluteUrl(p.href),
      lastmod: p.lastmod,
      changefreq: "monthly" as const,
      priority: p.location.type === "country" ? 0.8 : p.location.type === "state" ? 0.7 : 0.6,
    }));
}

/** Page `n` (1-based) of a geo family, or `null` when that page does not exist. */
export async function geoSitemapPage(
  family: GeoSitemapFamily,
  page: number,
): Promise<string | null> {
  if (!Number.isInteger(page) || page < 1) return null;
  const entries = await geoSitemapEntries(family.service);
  const pages = chunk(entries, SITEMAP_MAX_URLS);
  // Page 1 must always exist (an empty urlset is valid); higher pages only when there is overflow.
  if (page === 1) return renderUrlset(pages[0] ?? []);
  const selected = pages[page - 1];
  return selected ? renderUrlset(selected) : null;
}

/** Empty until Phase 3 wires articles and glossary terms. */
export function learnSitemapEntries(): SitemapEntry[] {
  return [];
}

/**
 * Practitioner photo + OG images (CLAUDE.md §8 "Image sitemap"). The placeholder portrait is
 * excluded; once a real photograph replaces `HERO.photo.src` it appears here automatically.
 */
export function imageSitemapEntries(): SitemapEntry[] {
  const portrait = HERO.photo.src;
  if (portrait.includes("placeholder")) return [];
  return [
    {
      loc: absoluteUrl("/"),
      images: [{ loc: absoluteUrl(portrait), title: "Astrologer Kavita" }],
    },
  ];
}

/** Every file the index lists, overflow files included, with the latest child `lastmod`. */
export async function sitemapIndexEntries(): Promise<SitemapIndexEntry[]> {
  const out: SitemapIndexEntry[] = [];
  const pages = pagesSitemapEntries();
  out.push({ loc: absoluteUrl("/sitemap-pages.xml"), lastmod: latestLastmod(pages) });

  for (const family of Object.values(GEO_SITEMAP_FAMILIES)) {
    const entries = await geoSitemapEntries(family.service);
    const chunks = chunk(entries, SITEMAP_MAX_URLS);
    const count = Math.max(1, chunks.length);
    for (let i = 0; i < count; i += 1) {
      out.push({
        loc: absoluteUrl(sitemapFileName(family.stem, i + 1)),
        lastmod: latestLastmod(chunks[i] ?? []),
      });
    }
  }

  out.push({
    loc: absoluteUrl("/sitemap-learn.xml"),
    lastmod: latestLastmod(learnSitemapEntries()),
  });
  const images = imageSitemapEntries();
  if (images.length > 0) out.push({ loc: absoluteUrl("/sitemap-images.xml") });
  return out;
}
