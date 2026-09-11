import { renderUrlset, sitemapSectionEntries, xmlResponse } from "@/lib/sitemaps";

/** Cached for an hour; regenerated in the background (CLAUDE.md §8). */
export const revalidate = 3600;

export async function GET() {
  const xml = renderUrlset(await sitemapSectionEntries("pages"));
  return xmlResponse(xml);
}
