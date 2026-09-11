import { GEO_SITEMAP_FAMILIES, geoSitemapPage, renderUrlset, xmlResponse } from "@/lib/sitemaps";

/** Cached for an hour; regenerated in the background (CLAUDE.md §8). */
export const revalidate = 3600;

export async function GET() {
  const xml = (await geoSitemapPage(GEO_SITEMAP_FAMILIES.vastu, 1)) ?? renderUrlset([]);
  return xmlResponse(xml);
}
