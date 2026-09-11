/** `GET /api/admin/sitemaps/preview?section=pages` — the XML exactly as it would be served (viewer+). */
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { isSitemapSection } from "@/lib/redirects/sitemap-config";
import {
  renderSitemapIndex,
  renderUrlset,
  sitemapIndexEntries,
  sitemapSectionEntries,
} from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

export const GET = adminRoute(
  async ({ searchParams }) => {
    const section = searchParams.get("section") ?? "index";
    const xml =
      section === "index"
        ? renderSitemapIndex(await sitemapIndexEntries())
        : isSitemapSection(section)
          ? renderUrlset(await sitemapSectionEntries(section))
          : null;
    if (xml === null) throw new AdminRouteError("not_found");
    return new Response(xml, {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" },
    });
  },
  { role: "viewer", requireDatabase: false },
);
