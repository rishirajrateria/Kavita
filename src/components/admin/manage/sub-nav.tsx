import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  label: string;
  href: string;
}

export const CONTENT_NAV: SubNavItem[] = [
  { label: "Testimonials", href: "/admin/content/testimonials" },
  { label: "Services", href: "/admin/content/services" },
  { label: "FAQs", href: "/admin/content/faqs" },
  { label: "Locations", href: "/admin/content/locations" },
  { label: "Learn & glossary", href: "/admin/content/glossary" },
];

export const SETTINGS_NAV: SubNavItem[] = [
  { label: "Availability", href: "/admin/settings/availability" },
  { label: "Notifications", href: "/admin/settings/notifications" },
  { label: "Users & roles", href: "/admin/settings/users" },
  { label: "Feature flags", href: "/admin/settings/flags" },
];

export const SITE_NAV: SubNavItem[] = [
  { label: "Identity", href: "/admin/site/identity" },
  { label: "Social links", href: "/admin/site/social-links" },
];

export const BOOKINGS_NAV: SubNavItem[] = [
  { label: "List", href: "/admin/bookings" },
  { label: "Calendar", href: "/admin/bookings/calendar" },
];

/** Horizontal section tabs (server-rendered; `current` is the page's own href). */
export function SubNav({
  items,
  current,
  label,
}: {
  items: SubNavItem[];
  current: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm no-underline transition-colors",
                  active
                    ? "border-accent-strong font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
