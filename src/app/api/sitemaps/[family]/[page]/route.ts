/**
 * Overflow geo sitemaps. Public URLs are `/sitemap-geo-astrology-2.xml`, `-3.xml`, … and
 * `/sitemap-geo-vastu-N.xml`; `src/proxy.ts` rewrites them to `/api/sitemaps/<family>/<n>`.
 * Page 1 of each family is its own static route (`src/app/sitemap-geo-*.xml/route.ts`).
 */
import { GEO_SITEMAP_FAMILIES, geoSitemapPage, xmlResponse } from "@/lib/sitemaps";

export const revalidate = 3600;

const isFamily = (value: string): value is keyof typeof GEO_SITEMAP_FAMILIES =>
  Object.hasOwn(GEO_SITEMAP_FAMILIES, value);

export async function GET(_request: Request, ctx: RouteContext<"/api/sitemaps/[family]/[page]">) {
  const { family, page } = await ctx.params;
  const n = Number(page);
  if (!isFamily(family) || !/^\d+$/.test(page) || n < 2) {
    return new Response("not found", { status: 404 });
  }
  const xml = await geoSitemapPage(GEO_SITEMAP_FAMILIES[family], n);
  return xml ? xmlResponse(xml) : new Response("not found", { status: 404 });
}
