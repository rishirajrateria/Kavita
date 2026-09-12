"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-items";

export interface MobileNavProps {
  items: readonly NavItem[];
  bookHref: string;
  /** Rendered inside the drawer, below the links (e.g. social icons from the server). */
  children?: React.ReactNode;
}

/**
 * Mobile navigation drawer built on the native `<dialog>` element instead of a Radix Sheet.
 * `showModal()` gives a real focus trap, Escape-to-close and focus return to the trigger for
 * ~1KB of JS, which keeps the site-wide header out of the client bundle's critical path.
 */
export function MobileNav({ items, bookHref, children }: MobileNavProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  const openDrawer = React.useCallback(() => {
    const el = dialogRef.current;
    if (!el || el.open) return;
    el.showModal();
    setOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    const el = dialogRef.current;
    if (!el || !el.open) return;
    el.close();
  }, []);

  // Keep React state in sync when the browser closes the dialog itself (Escape key).
  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => setOpen(false);
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, []);

  // Close when navigating via a link so the drawer never lingers over the new page.
  const onNavigate = React.useCallback(() => closeDrawer(), [closeDrawer]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 md:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={openDrawer}
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </Button>

      <dialog
        ref={dialogRef}
        id={id}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        onClick={(e) => {
          // Click on the backdrop (outside the panel) closes the drawer.
          if (e.target === e.currentTarget) closeDrawer();
        }}
        className={cn(
          "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0",
          "backdrop:bg-surface-inverse-deep/80 backdrop:backdrop-blur-[3px]",
          "justify-end open:flex md:hidden",
        )}
      >
        <div
          className={cn(
            // `.glass` for the blur, the specular lips and the shadow, but with a near-opaque
            // fill: a drawer is read, not admired, and a <dialog> in the top layer sits over
            // running body copy that must not compete with the links on top of it.
            "glass flex h-full w-[min(21rem,88vw)] flex-col rounded-none border-y-0 border-r-0",
            "border-l-accent-border/35 bg-background/94 text-foreground",
            "motion-safe:animate-in motion-safe:duration-(--duration-base) motion-safe:slide-in-from-right",
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-6">
            <div>
              <p
                id={`${id}-title`}
                className="font-serif text-2xl font-normal tracking-[0.005em] text-foreground"
              >
                Menu
              </p>
              <p id={`${id}-desc`} className="mt-1 text-sm text-muted-foreground">
                Vedic astrology and vastu, read together.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mt-1 -mr-1 size-11 shrink-0"
              aria-label="Close menu"
              onClick={closeDrawer}
              autoFocus
            >
              <XIcon className="size-5" aria-hidden="true" />
            </Button>
          </div>

          <nav aria-label="Primary (mobile)" className="flex-1 overflow-y-auto px-5">
            <ul className="flex flex-col border-t border-accent-border/20">
              {items.map((item) => (
                <li key={item.href} className="border-b border-accent-border/20">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className="group flex items-center justify-between gap-3 py-3.5 font-serif text-lg font-normal text-foreground no-underline transition-colors duration-(--duration-fast) ease-standard hover:text-accent-strong"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="translate-x-0 text-accent-strong/50 transition-transform duration-(--duration-base) ease-standard group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-4 px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Button asChild variant="gold" size="xl" className="w-full">
              <Link href={bookHref} onClick={onNavigate}>
                Book a consultation
              </Link>
            </Button>
            <div className="flex items-center justify-between gap-2 border-t border-accent-border/20 pt-4">
              {children}
              <ThemeToggle showLabel />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
