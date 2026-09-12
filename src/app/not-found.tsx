import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { logNotFound } from "@/lib/redirects/not-found-log";

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

export default async function NotFound() {
  // Phase 6: record the missing path (from the proxy's `x-ak-path` header) in `not_found_log`.
  // Fire-and-forget and deduplicated; the page renders identically when there is no database.
  try {
    logNotFound(await headers());
  } catch {
    /* static render or no request scope — nothing to log */
  }
  return (
    <Section spacing="lg" className="overflow-hidden">
      {/*
       * A lost visitor gets the compass rose: the one motif on the site that is literally about
       * orientation. Large, very faint, turning once every six minutes — atmosphere behind the
       * text, never competing with it.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-[0.1]"
      >
        <VastuCompass
          decorative
          hideLabels
          data-turn
          className="w-[34rem] max-w-[150%] text-accent-strong [--turn-duration:360s]"
        />
      </div>

      <Container size="narrow" className="relative flex flex-col items-center gap-10 text-center">
        <div>
          <Heading
            as="h1"
            level={1}
            eyebrow="Error 404"
            className="[&>[data-slot=eyebrow]]:justify-center"
          >
            This page is not here
          </Heading>
          <p className="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">
            The address may have been typed incorrectly, or the page has moved. Nothing has been
            lost — everything on this site is reachable from the links below.
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
