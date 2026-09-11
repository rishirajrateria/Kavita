import { isPreviewMode } from "@/lib/preview-mode";
import { getRobotsConfig, renderRobotsTxt } from "@/lib/robots-config";
import { getSiteUrl } from "@/lib/site";

/** A preview deploy carries placeholder copy: keep every crawler out of it entirely. */
const PREVIEW_ROBOTS = `# Preview deployment — not the live site.
# ALLOW_PLACEHOLDER_CONTENT is set, so this build still contains placeholder content
# and must not be indexed by anyone. Unset that variable to restore the real robots.txt.
User-agent: *
Disallow: /
`;

export const revalidate = 3600;

export async function GET() {
  if (isPreviewMode()) {
    return new Response(PREVIEW_ROBOTS, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return new Response(renderRobotsTxt(getSiteUrl(), await getRobotsConfig()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
