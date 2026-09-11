"use client";

/**
 * The only client piece of the sidebar: marks the current item with `aria-current` from the
 * pathname (a Server Component cannot read it without making every page dynamic on headers).
 * Icons and config are passed in, so the bundle is the list rendering only.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isNavItemActive } from "./nav";

export function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(item, pathname);
              const Icon = item.icon;
              if (item.phase) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled="true"
                      title={`Arrives in Phase ${item.phase}`}
                      className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground/70"
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto rounded-full border border-border px-1.5 text-[0.6rem] tracking-wide uppercase">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-md px-3 text-sm no-underline transition-colors duration-(--duration-fast)",
                      active
                        ? "bg-accent text-accent-foreground shadow-[inset_2px_0_0_0_var(--accent-border)]"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
