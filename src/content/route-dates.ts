/**
 * Last-modified dates of the hand-written core routes, used as sitemap `lastmod` (CLAUDE.md
 * §8: "accurate `lastmod` from real content mtime, never `new Date()`").
 *
 * Maintained by hand: bump a route's date in the same change that edits its copy. Geo pages
 * take theirs from the location record's `contentUpdatedAt`; Learn content will carry its own
 * `dateModified` (Phase 3). A route missing from this map has no `lastmod` in the sitemap,
 * which is better than a wrong one.
 */
export const ROUTE_DATES: Readonly<Record<string, string>> = {
  "/": "2026-09-11",
  "/for-ai": "2026-09-11",
  "/book": "2026-09-11",
  "/design-system": "2026-09-11",
};
