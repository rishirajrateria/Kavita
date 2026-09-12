import Link from "next/link";
import { VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSiteSettings } from "@/lib/data";
import { MobileNav } from "./mobile-nav";
import { BOOK_HREF, PRIMARY_NAV } from "./nav-items";
import { SocialLinks } from "./social-links";

/**
 * Site header. Server component; only the mobile drawer and theme toggle hydrate.
 *
 * A frosted rail rather than a painted band: `.glass` over the fixed <Sky />, squared off and
 * stripped of its side and top edges so only the gold hairline underneath survives. The blur is
 * what separates it from the page — there is no scroll listener, and at rest the fill is the
 * background colour itself, so the rail is invisible until content passes beneath it.
 *
 * The fill is overridden to `--background` so the rail is the colour of the page it sits on;
 * everything else — the blur, the specular top lip, the shaded bottom lip and the drop shadow —
 * comes from `.glass`, so retuning `--glass-blur` retunes the header with it.
 */
export async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 border-b-accent-border/45 bg-background/55">
      <div className="mx-auto flex h-16 w-full max-w-wide items-center gap-4 px-gutter md:h-20">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-md text-foreground no-underline"
          aria-label={`${settings.brandName} — home`}
        >
          <VastuCompass
            decorative
            hideLabels
            strokeWidth={1}
            data-turn
            style={{ ["--turn-duration" as string]: "420s" }}
            className="size-7 text-accent-strong/80 transition-colors duration-(--duration-base) ease-standard group-hover:text-accent-strong"
          />
          <span className="font-serif text-[1.35rem] font-normal tracking-[0.005em] md:text-2xl">
            {settings.brandName}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="nav-link inline-flex h-10 items-center rounded-md px-3 text-sm text-muted-foreground no-underline hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-5">
          <SocialLinks placement="header" className="hidden lg:flex" iconSize={17} />
          <ThemeToggle className="hidden md:inline-flex" />
          <span
            aria-hidden="true"
            className="mx-2 hidden h-6 w-px bg-accent-border/25 md:inline-block"
          />
          <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
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
