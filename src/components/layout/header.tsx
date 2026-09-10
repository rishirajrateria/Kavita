import Link from "next/link";
import { VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSiteSettings } from "@/lib/data";
import { MobileNav } from "./mobile-nav";
import { BOOK_HREF, PRIMARY_NAV } from "./nav-items";
import { SocialLinks } from "./social-links";

/** Site header. Server component; only the mobile sheet and theme toggle hydrate. */
export async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 w-full max-w-wide items-center gap-4 px-gutter">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md text-foreground no-underline"
          aria-label={`${settings.brandName} — home`}
        >
          <VastuCompass decorative hideLabels className="size-8 text-accent-strong" />
          <span className="font-serif text-xl font-medium tracking-tight">
            {settings.brandName}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-foreground/85 no-underline transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <SocialLinks placement="header" className="hidden lg:flex" iconSize={18} />
          <ThemeToggle className="hidden md:inline-flex" />
          <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
            <Link href={BOOK_HREF}>Book a consultation</Link>
          </Button>
          <MobileNav items={PRIMARY_NAV} bookHref={BOOK_HREF}>
            <SocialLinks placement="header" iconSize={18} />
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
