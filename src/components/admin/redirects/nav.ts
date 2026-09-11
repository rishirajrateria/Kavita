/** Section tabs shared by the P6-B admin screens (redirects, 404 log, sitemaps, indexing). */
import type { SubNavItem } from "@/components/admin/manage/sub-nav";

export const SEARCH_TOOLS_NAV: SubNavItem[] = [
  { label: "Redirects", href: "/admin/redirects" },
  { label: "404 log", href: "/admin/not-found-log" },
  { label: "Sitemaps", href: "/admin/sitemaps" },
  { label: "Indexing", href: "/admin/indexing" },
];
