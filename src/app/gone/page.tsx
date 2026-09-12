import type { Metadata } from "next";
import Link from "next/link";
import { AstronomicalLines } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

/**
 * "Gone" page (CLAUDE.md §8: a proper 410 for intentionally removed content). The proxy serves
 * this page's HTML with status 410 for every redirect rule whose status is 410, and answers 410
 * for `/gone` itself, so a crawler that follows the link is told the truth. The page is
 * `noindex` and is left out of the sitemap and the route registry.
 */
export const metadata: Metadata = {
  title: "This page has been removed",
  description: "The page you asked for was removed on purpose and is not coming back.",
  robots: { index: false, follow: false },
};

const ROUTES = [
  { label: "Astrology", href: "/astrology", note: "Birth charts, dashas, timing and matching." },
  { label: "Vastu", href: "/vastu", note: "Homes, offices and floor plans, read with the chart." },
  { label: "Services", href: "/services", note: "Every consultation, with what to prepare." },
  { label: "Learn", href: "/learn", note: "Guides and the glossary, one question per page." },
] as const;

export default function GonePage() {
  return (
    <Section spacing="lg" className="overflow-hidden">
      {/* Setting orbits rather than the compass: this address is not lost, it has gone down. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-[0.09]"
      >
        {/* `data-breathe` animates opacity, so the fade lives on the wrapper, not the svg. */}
        <AstronomicalLines
          decorative
          data-breathe
          className="w-[52rem] max-w-[150%] text-accent-strong"
        />
      </div>

      <Container size="narrow" className="relative flex flex-col items-center gap-10 text-center">
        <div>
          <Heading
            as="h1"
            level={1}
            eyebrow="Error 410"
            className="[&>[data-slot=eyebrow]]:justify-center"
          >
            This page has been removed
          </Heading>
          <p className="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">
            The page at this address was taken down on purpose and will not return. If you arrived
            from a search result or an old link, the sections below hold everything that is still
            current.
          </p>
        </div>

        <ul className="grid w-full gap-4 text-left sm:grid-cols-2">
          {ROUTES.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="glass block h-full p-5 no-underline transition-[transform,border-color,box-shadow] duration-300 ease-(--ease-standard) hover:-translate-y-0.5 hover:border-accent-border"
              >
                <span className="block font-serif text-xl text-foreground">{r.label}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                  {r.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Button asChild variant="gold" size="lg">
          <Link href="/">Back to the home page</Link>
        </Button>
      </Container>
    </Section>
  );
}
