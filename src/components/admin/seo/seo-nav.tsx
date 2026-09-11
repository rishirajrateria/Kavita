import { SubNav, type SubNavItem } from "@/components/admin/manage/sub-nav";

/** Tabs across the P6-A SEO-control screens (other Phase 6 sections live in the sidebar). */
export const SEO_NAV: SubNavItem[] = [
  { label: "Pages", href: "/admin/seo" },
  { label: "FAQs", href: "/admin/faqs" },
  { label: "AEO", href: "/admin/aeo" },
  { label: "Social", href: "/admin/social" },
];

export function SeoNav({ current }: { current: string }) {
  return <SubNav items={SEO_NAV} current={current} label="SEO sections" />;
}
