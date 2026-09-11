/**
 * Admin sidebar navigation. One config, consumed by the desktop sidebar and the phone drawer.
 * Entries for later phases carry `phase` so they render as "coming" rows, not dead links.
 */
import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  BarChart3Icon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  CompassIcon,
  FileTextIcon,
  GlobeIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  PlugIcon,
  RadioIcon,
  SearchIcon,
  SettingsIcon,
  TargetIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match child routes too (`/admin/bookings/123`). Overview (`/admin`) is exact. */
  exact?: boolean;
  /** Set for routes that ship in a later phase; rendered disabled with the phase tag. */
  phase?: 6;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Analytics",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboardIcon, exact: true },
      { label: "Realtime", href: "/admin/realtime", icon: RadioIcon },
      { label: "Traffic", href: "/admin/traffic", icon: BarChart3Icon },
      { label: "Geography", href: "/admin/geography", icon: GlobeIcon },
      { label: "Pages", href: "/admin/pages", icon: FileTextIcon },
      { label: "Behaviour", href: "/admin/behaviour", icon: MousePointerClickIcon },
      { label: "Acquisition", href: "/admin/acquisition", icon: CompassIcon },
      { label: "Technology", href: "/admin/technology", icon: MonitorSmartphoneIcon },
      { label: "Conversions", href: "/admin/conversions", icon: TargetIcon },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Bookings", href: "/admin/bookings", icon: CalendarDaysIcon },
      { label: "Content", href: "/admin/content/testimonials", icon: BookOpenIcon },
      { label: "Settings", href: "/admin/settings/availability", icon: SettingsIcon },
      { label: "Site", href: "/admin/site/identity", icon: ActivityIcon },
    ],
  },
  {
    label: "Phase 6",
    items: [
      { label: "SEO", href: "/admin/seo", icon: SearchIcon, phase: 6 },
      { label: "Integrations", href: "/admin/integrations", icon: PlugIcon, phase: 6 },
      { label: "Health", href: "/admin/health", icon: HeartPulseIcon, phase: 6 },
      { label: "Audit log", href: "/admin/audit", icon: ClipboardListIcon, phase: 6 },
    ],
  },
];

/** Section prefixes used to decide which nav item is current for a pathname. */
export function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  const section = item.href.split("/").slice(0, 3).join("/");
  return pathname === item.href || pathname.startsWith(`${section}/`) || pathname === section;
}

/** Title for the header, derived from the nav so pages do not repeat it. */
export function navTitleFor(pathname: string): string {
  for (const group of ADMIN_NAV) {
    for (const item of group.items) if (isNavItemActive(item, pathname)) return item.label;
  }
  return "Admin";
}
