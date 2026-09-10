import Link from "next/link";
import { VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSiteSettings } from "@/lib/data";
import { MobileNav } from "./mobile-nav";
import { BOOK_HREF, PRIMARY_NAV } from "./nav-items";
import { SocialLinks } from "./social-links";

/**
 * Site header. Server component; only the mobile drawer and theme toggle hydrate. Sticky and
 * translucent ivory over a backdrop blur, with a permanent gold-tinted hairline underneath so it
 * separates from content the moment anything scrolls beneath it — no scroll listener.
 */
export async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 w-full max-w-wide items-center gap-4 px-gutter">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md text-foreground no-underline"
          aria-label={`${settings.brandName} — home`}
        >
          <VastuCompass
            decorative
            hideLabels
            strokeWidth={1.1}
            className="size-7 text-accent-strong"
          />
          <span className="font-serif text-xl font-medium tracking-tight">
            {settings.brandName}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-0.5">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="nav-link inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-foreground/85 no-underline hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-3">
          <SocialLinks placement="header" className="hidden lg:flex" iconSize={18} />
          <ThemeToggle className="hidden md:inline-flex" />
          <Button asChild variant="gold" size="sm" className="ml-1 hidden sm:inline-flex">
            <Link href={BOOK_HREF}>Book a consultation</Link>
          </Button>
          <MobileNav items={PRIMARY_NAV} bookHref={BOOK_HREF}>
            <SocialLinks placement="header" iconSize={20} />
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
