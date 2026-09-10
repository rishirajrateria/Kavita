import type { Metadata } from "next";
import Link from "next/link";
import { AstronomicalLines } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you asked for does not exist or has moved.",
  // Overrides the root layout's index/follow; Next also emits its own `noindex` for not-found.
  robots: { index: false, follow: false },
};

const ROUTES = [
  { label: "Astrology", href: "/astrology", note: "Birth charts, dashas, timing and matching." },
  { label: "Vastu", href: "/vastu", note: "Homes, offices and floor plans, read with the chart." },
  { label: "Services", href: "/services", note: "Every consultation, with what to prepare." },
  { label: "Contact", href: "/contact", note: "Ask a question or check availability." },
] as const;

export default function NotFound() {
  return (
    <Section spacing="lg">
      <Container size="narrow" className="flex flex-col gap-8">
        <AstronomicalLines decorative className="h-16 w-40 text-accent-strong" />
        <div>
          <Heading as="h1" level={1} eyebrow="Error 404">
            This page is not here
          </Heading>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            The address may have been typed incorrectly, or the page has moved. Nothing has been
            lost — everything on this site is reachable from the links below.
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
