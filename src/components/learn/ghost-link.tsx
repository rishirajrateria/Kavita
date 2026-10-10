import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The ruled ghost link of the home practitioner card and the closing disc — a hero's
 * secondary action and the "see all" link under a list. A Cormorant line on a hairline with
 * an arrow that steps forward under the hand.
 */
export function GhostLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1",
        className,
      )}
    >
      {children}
      <span aria-hidden="true" data-arrow className="inline-block">
        →
      </span>
    </Link>
  );
}
