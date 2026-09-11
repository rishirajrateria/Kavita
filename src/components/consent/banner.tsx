"use client";

/**
 * Consent banner (CLAUDE.md §13E). Rendered by `<Integrations />` only when at least one
 * third-party tag is enabled AND the visitor's region requires consent — if no pixel is
 * enabled, no banner exists at all. `open` is the server's verdict (no stored choice under the
 * current policy version); the island also re-opens on a click of the footer's
 * `[data-consent-manage]` link, so a visitor can change their mind at any time.
 *
 * Accept and Reject carry equal visual weight — no dark pattern, no pre-ticked box, no
 * "continue browsing means yes". Dismissing without choosing is not possible: there is no X.
 * The choice is posted to `/api/consent`, which writes `consent_log` and sets `ak_consent`;
 * the page then reloads so the server re-decides which tags may load.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface ConsentBannerProps {
  open: boolean;
  title: string;
  body: string;
  acceptLabel: string;
  rejectLabel: string;
  policyVersion: string;
}

export function ConsentBanner({
  open,
  title,
  body,
  acceptLabel,
  rejectLabel,
  policyVersion,
}: ConsentBannerProps) {
  const [visible, setVisible] = useState(open);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onManage = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-consent-manage]")) return;
      event.preventDefault();
      setVisible(true);
    };
    document.addEventListener("click", onManage, true);
    return () => document.removeEventListener("click", onManage, true);
  }, []);

  useEffect(() => {
    if (visible) headingRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  async function choose(marketing: boolean) {
    setBusy(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketing, policyVersion }),
      });
    } catch {
      // Offline: the choice is not stored, so the banner will ask again. Never load a tag.
    }
    setVisible(false);
    // Re-render the page server-side so `<Integrations />` re-decides with the new cookie.
    window.location.reload();
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="ak-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-accent-border/50 bg-card/95 px-4 py-4 shadow-[0_-8px_30px_rgb(0_0_0/0.08)] backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <h2
          id="ak-consent-title"
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-base font-medium tracking-tight outline-none"
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="gold"
            size="sm"
            disabled={busy}
            onClick={() => void choose(true)}
          >
            {acceptLabel}
          </Button>
          <Button
            type="button"
            variant="gold-outline"
            size="sm"
            disabled={busy}
            onClick={() => void choose(false)}
          >
            {rejectLabel}
          </Button>
          <a href="/privacy#consent" className="text-sm underline underline-offset-4">
            Privacy policy
          </a>
        </div>
      </div>
    </div>
  );
}
