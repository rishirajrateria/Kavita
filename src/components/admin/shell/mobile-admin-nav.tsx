"use client";

/**
 * Phone navigation for the admin: a native `<dialog>` drawer (focus trap, Escape and focus
 * return for free), opened from the header. Same nav config as the desktop sidebar.
 */
import { MenuIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { AdminNavLinks } from "./nav-links";

export function MobileAdminNav({ brand }: { brand: string }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open admin menu"
        onClick={open}
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </Button>
      <dialog
        ref={ref}
        data-tone="inverse"
        aria-label="Admin navigation"
        className="m-0 h-dvh max-h-none w-[min(20rem,88vw)] max-w-none bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50 open:flex open:flex-col"
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-serif text-lg">{brand}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close admin menu"
            onClick={close}
          >
            <XIcon className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
          <AdminNavLinks onNavigate={close} />
        </nav>
      </dialog>
    </>
  );
}
