/**
 * Preview mode: one switch that lets an unfinished site be deployed and looked at without any
 * risk of it being treated as the real launch.
 *
 * Set `ALLOW_PLACEHOLDER_CONTENT=true` and the content gate in `scripts/validate-content.ts`
 * downgrades its placeholder failures to warnings so the build ships. Everything here is the
 * other half of that bargain, and it is not optional: the site goes `noindex, nofollow`, the
 * generated `robots.txt` disallows every crawler, the sitemaps are emptied and a standing banner
 * says what the visitor is looking at. Unset the variable for the real launch and the honesty
 * gate (CLAUDE.md §12) returns to blocking the build.
 */
import "server-only";

export function isPreviewMode(): boolean {
  return process.env.ALLOW_PLACEHOLDER_CONTENT === "true";
}

export const PREVIEW_BANNER_TEXT =
  "Preview build — this site is not live. Practitioner details, prices and client experiences " +
  "are placeholders, and search engines are blocked from indexing it.";
