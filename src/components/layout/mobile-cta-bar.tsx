"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XIcon } from "lucide-react";
import { SocialIcon } from "@/components/icons/social";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MobileCtaBarProps {
  bookHref: string;
  /** `https://wa.me/<digits>` computed on the server; `null` hides the WhatsApp button. */
  whatsappHref: string | null;
}

const DISMISS_KEY = "kavita:cta-bar-dismissed";
const DISMISS_EVENT = "kavita:cta-bar-dismiss";
const SHOW_AFTER = 0.4;

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DISMISS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Fixed bottom call-to-action bar for small screens. Appears once the visitor has scrolled 40%
 * of the page, can be dismissed for the session, and is `aria-hidden` + `inert` while hidden so
 * it never captures focus off-screen.
 *
 * Visually the mirror of the header: the same frosted rail, gold hairline on the edge facing
 * the page. The fill stays near-opaque rather than true glass — this bar sits over running body
 * copy, and a tool you tap must not compete with the text it is covering.
 */
export function MobileCtaBar({ bookHref, whatsappHref }: MobileCtaBarProps) {
  const pathname = usePathname();
  // The booking flow and self-service pages have their own primary actions; never overlay them.
  const suppressed = pathname === "/book" || pathname.startsWith("/booking");
  const [visible, setVisible] = React.useState(false);
  const dismissed = React.useSyncExternalStore(subscribeDismissed, readDismissed, () => false);

  React.useEffect(() => {
    if (dismissed) return;
    let ticking = false;
    let frame = 0;
    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      setVisible(progress >= SHOW_AFTER);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [dismissed]);

  const shown = visible && !dismissed && !suppressed;

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage unavailable — falls back to hiding for this render only */
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Quick actions"
      aria-hidden={!shown}
      inert={!shown}
      data-state={shown ? "open" : "closed"}
      className={cn(
        "glass fixed inset-x-0 bottom-0 z-30 rounded-none border-x-0 border-b-0 border-t-accent-border/30",
        "bg-background/88 transition-transform duration-(--duration-base) ease-standard motion-reduce:transition-none md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        shown ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-2 px-gutter py-2.5">
        <Button asChild variant="gold" size="default" className="flex-1">
          <Link href={bookHref}>Book a consultation</Link>
        </Button>
        {whatsappHref ? (
          <Button asChild variant="gold-outline" size="default" className="flex-1">
            <a href={whatsappHref} target="_blank" rel="noopener" data-event="whatsapp_clicked">
              <SocialIcon name="whatsapp" size={18} />
              WhatsApp
            </a>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-10 shrink-0"
          onClick={dismiss}
          aria-label="Dismiss quick actions"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
