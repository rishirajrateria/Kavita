import type { SubNavItem } from "@/components/admin/manage/sub-nav";

/** Tabs across the integrations section (CLAUDE.md §13A–E). */
export const INTEGRATIONS_NAV: SubNavItem[] = [
  { label: "Connections", href: "/admin/integrations" },
  { label: "Verification", href: "/admin/integrations/verification" },
  { label: "Event mapping", href: "/admin/integrations/events" },
  { label: "Consent", href: "/admin/integrations/consent" },
  { label: "What's loading", href: "/admin/integrations/preview" },
];
