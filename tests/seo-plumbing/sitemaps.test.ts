/**
 * Sitemap generator tests (`pnpm test:seo`). Unit-tests the functions the `/sitemap*.xml`
 * routes call, then renders the real index and every family page and checks the XML.
 */
import {
  GEO_SITEMAP_FAMILIES,
  SITEMAP_MAX_URLS,
  chunk,
  escapeXml,
  geoSitemapEntries,
  geoSitemapPage,
  imageSitemapEntries,
  latestLastmod,
  learnSitemapEntries,
  pagesSitemapEntries,
  renderSitemapIndex,
  renderUrlset,
  sitemapFileName,
  sitemapIndexEntries,
} from "@/lib/sitemaps";
import { assertWellFormedXml, check, equal, excludes, includes } from "./_assert";

export async function run(): Promise<void> {
  equal(escapeXml(`a&b<c>"d'`), "a&amp;b&lt;c&gt;&quot;d&apos;", "escapeXml");
  equal(sitemapFileName("sitemap-geo-astrology", 1), "/sitemap-geo-astrology.xml", "page 1 file");
  equal(sitemapFileName("sitemap-geo-astrology", 3), "/sitemap-geo-astrology-3.xml", "page 3 file");
  equal(chunk([1, 2, 3, 4, 5], 2).length, 3, "chunk count");
  equal(chunk([], 2).length, 0, "chunk empty");
  equal(
    latestLastmod([{ lastmod: "2026-01-01" }, { lastmod: "2026-09-11" }, {}]),
    "2026-09-11",
    "latest",
  );
  equal(latestLastmod([]), undefined, "latest of none");

  const urlset = renderUrlset([
    {
      loc: "https://example.com/a?x=1&y=2",
      lastmod: "2026-09-11",
      changefreq: "weekly",
      priority: 0.8,
    },
    { loc: "https://example.com/b", lastmod: "not-a-date" },
  ]);
  assertWellFormedXml(urlset, "urlset");
  includes(urlset, "<loc>https://example.com/a?x=1&amp;y=2</loc>", "loc escaped");
  includes(urlset, "<lastmod>2026-09-11</lastmod>", "lastmod");
  includes(urlset, "<priority>0.8</priority>", "priority");
  excludes(urlset, "not-a-date", "invalid lastmod dropped");
  excludes(urlset, "xmlns:image", "no image namespace without images");

  const withImage = renderUrlset([
    {
      loc: "https://example.com/",
      images: [{ loc: "https://example.com/p.jpg", title: "K & co" }],
    },
  ]);
  assertWellFormedXml(withImage, "image urlset");
  includes(withImage, 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"', "image ns");
  includes(withImage, "<image:title>K &amp; co</image:title>", "image title escaped");

  const empty = renderUrlset([]);
  assertWellFormedXml(empty, "empty urlset");
  includes(empty, "<urlset", "empty urlset still valid");

  const big = renderUrlset(
    Array.from({ length: SITEMAP_MAX_URLS + 5 }, (_, i) => ({ loc: `https://example.com/${i}` })),
  );
  equal((big.match(/<url>/g) ?? []).length, SITEMAP_MAX_URLS, "urlset capped at max");

  const index = renderSitemapIndex([
    { loc: "https://example.com/sitemap-pages.xml", lastmod: "2026-09-11" },
  ]);
  assertWellFormedXml(index, "sitemapindex");
  includes(index, "<sitemapindex", "index root");

  // Real data.
  const pages = pagesSitemapEntries();
  check(
    pages.some((p) => p.loc.endsWith("/for-ai")),
    "pages sitemap lists /for-ai",
  );
  check(
    !pages.some((p) => p.loc.includes("/design-system") || p.loc.endsWith("/book")),
    "no noindex routes",
  );
  check(
    pages.every((p) => /^https?:\/\//.test(p.loc)),
    "absolute locs",
  );
  check(
    pages.every((p) => p.lastmod !== undefined),
    "every core page has a lastmod",
  );
  assertWellFormedXml(renderUrlset(pages), "pages sitemap");
  assertWellFormedXml(renderUrlset(learnSitemapEntries()), "learn sitemap");
  assertWellFormedXml(renderUrlset(imageSitemapEntries()), "image sitemap");
  check(
    imageSitemapEntries().every((e) => !e.images?.some((i) => i.loc.includes("placeholder"))),
    "placeholder photo excluded",
  );

  for (const family of Object.values(GEO_SITEMAP_FAMILIES)) {
    const entries = await geoSitemapEntries(family.service);
    check(
      entries.every((e) => e.loc.includes(`/${family.service}/`)),
      `${family.stem}: family hrefs`,
    );
    check(
      entries.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.lastmod ?? "")),
      `${family.stem}: lastmod dates`,
    );
    const page1 = await geoSitemapPage(family, 1);
    check(page1 !== null, `${family.stem}: page 1 exists`);
    if (page1) assertWellFormedXml(page1, family.stem);
    const overflow = Math.max(2, Math.ceil(entries.length / SITEMAP_MAX_URLS) + 1);
    equal(await geoSitemapPage(family, overflow), null, `${family.stem}: no page ${overflow}`);
    equal(await geoSitemapPage(family, 0), null, `${family.stem}: no page 0`);
  }

  const indexEntries = await sitemapIndexEntries();
  const locs = indexEntries.map((e) => e.loc);
  for (const file of [
    "/sitemap-pages.xml",
    "/sitemap-geo-astrology.xml",
    "/sitemap-geo-vastu.xml",
    "/sitemap-learn.xml",
  ]) {
    check(
      locs.some((l) => l.endsWith(file)),
      `index lists ${file}`,
    );
  }
  assertWellFormedXml(renderSitemapIndex(indexEntries), "real sitemap index");
}
