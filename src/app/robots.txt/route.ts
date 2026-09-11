import { getRobotsConfig, renderRobotsTxt } from "@/lib/robots-config";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  return new Response(renderRobotsTxt(getSiteUrl(), await getRobotsConfig()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
