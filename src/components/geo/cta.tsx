import Link from "next/link";
import { SouthIndianChart, VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { GEO_SERVICE_META, geoBookHref } from "@/lib/geo/service";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";
import type { Question } from "./answers";

/**
 * Closing call to action on deep indigo: book the integrated reading pre-filled with the place;
 * WhatsApp as the secondary action when the number is real, otherwise the contact page.
 */
export async function GeoCta({
  loc,
  service,
  question,
  route,
  whatsappHref,
}: {
  loc: LocationRecord;
  service: GeoService;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides (`h2_id` = `book`). */
  route?: string;
  whatsappHref: string | null;
}) {
  const Motif = GEO_SERVICE_META[service].motif === "compass" ? VastuCompass : SouthIndianChart;
  const overrides = route ? await getAnswerOverridesForRoute(route) : {};
  const answer = pickAnswer(overrides, "book", question.answer);

  return (
    <Section
      id="book"
      spacing="lg"
      tone="inverse"
      depth="deep"
      className="grain overflow-hidden border-t border-border"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[38rem] -translate-x-1/2 -translate-y-1/2 text-gold-300/10 sm:w-[46rem]"
      >
        <Motif decorative hideLabels description="" strokeWidth={0.6} />
      </div>

      <Container size="narrow" className="relative space-y-7 text-center">
        <Heading
          as="h2"
          level={2}
          eyebrow={question.eyebrow}
          className="mx-auto max-w-[24ch] text-4xl [&>[data-slot=eyebrow]]:justify-center"
        >
          {question.question}
        </Heading>
        <p className="answer border-inline-start-0 mx-auto pl-0 text-left text-lg sm:text-center">
          {answer}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold" size="xl">
            <Link href={geoBookHref(loc)}>Book from {loc.shortName ?? loc.name}</Link>
          </Button>
          <Button asChild variant="ghost" size="xl">
            {whatsappHref ? (
              <a href={whatsappHref} rel="noopener">
                Message on WhatsApp
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </a>
            ) : (
              <Link href="/contact">
                Ask a question first
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            )}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
