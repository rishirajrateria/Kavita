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
    <Section spacing="lg">
      <Container size="narrow" className="flex flex-col gap-8">
        <AstronomicalLines decorative className="h-16 w-40 text-accent-strong" />
        <div>
          <Heading as="h1" level={1} eyebrow="Error 410">
            This page has been removed
          </Heading>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            The page at this address was taken down on purpose and will not return. If you arrived
            from a search result or an old link, the sections below hold everything that is still
            current.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ROUTES.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="block h-full rounded-lg border bg-card p-4 no-underline transition-colors hover:border-accent-border hover:bg-accent"
              >
                <span className="block font-serif text-lg font-medium text-foreground">
                  {r.label}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{r.note}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <Button asChild variant="primary" size="lg">
            <Link href="/">Back to the home page</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
