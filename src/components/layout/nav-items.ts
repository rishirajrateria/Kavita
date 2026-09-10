/** Primary navigation. Shared by the desktop header and the mobile sheet. */
export interface NavItem {
  label: string;
  href: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Astrology", href: "/astrology" },
  { label: "Vastu", href: "/vastu" },
  { label: "Services", href: "/services" },
  { label: "Learn", href: "/learn" },
  { label: "About", href: "/about" },
  { label: "Testimonials", href: "/testimonials" },
] as const;

export const BOOK_HREF = "/book";
