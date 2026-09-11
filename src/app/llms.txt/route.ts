import { getCountries, getServices, getSiteSettings } from "@/lib/data";
import { listGeoPages } from "@/lib/geo/pages";
import { buildLlmsTxt } from "@/lib/markdown/llms";
import { getLlmsDocument } from "@/lib/seo/documents";
import { getSiteUrl } from "@/lib/site";

/** Static index, regenerated hourly (CLAUDE.md §9.5). */
export const revalidate = 3600;

export async function GET() {
  const [settings, services, countries, geoPages, document] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getCountries(),
    listGeoPages(),
    getLlmsDocument(),
  ]);
  const body = buildLlmsTxt({
    siteUrl: getSiteUrl(),
    settings,
    services,
    countries,
    geoPages,
    document,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
