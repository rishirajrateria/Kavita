import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import { Byline, CtaBand, FaqBlock, PageHero, QuestionSection } from "@/components/content";
import { JsonLd } from "@/components/seo/json-ld";
import { TestimonialCard } from "@/components/testimonials/card";
import { TestimonialFilters } from "@/components/testimonials/filters";
import { loadTestimonialContext } from "@/components/testimonials/resolve";
import { aggregateRatingSchema, reviewSchema, reviewable } from "@/components/testimonials/schema";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Container } from "@/components/ui/container";
import {
  TESTIMONIALS_DATES,
  TESTIMONIALS_FAQ,
  TESTIMONIALS_HERO,
  TESTIMONIALS_INTRO,
  TESTIMONIALS_LIST,
  TESTIMONIALS_META,
  TESTIMONIALS_PLACEHOLDER,
} from "@/content/pages/testimonials";
import { getPublishedTestimonials } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

const BASE_METADATA: Metadata = {
  title: { absolute: TESTIMONIALS_META.title },
  description: TESTIMONIALS_META.description,
  alternates: { canonical: "/testimonials" },
  openGraph: {
    type: "website",
    url: "/testimonials",
    title: TESTIMONIALS_META.title,
    description: TESTIMONIALS_META.description,
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/testimonials");
}

const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

/**
 * All client experiences (CLAUDE.md §12). Filters are plain links handled here on the server.
 * Review / AggregateRating JSON-LD only when at least one real, consented testimonial exists.
 */
export default async function TestimonialsPage({ searchParams }: PageProps<"/testimonials">) {
  const sp = await searchParams;
  const activeService = one(sp.service);
  const activeRegion = one(sp.region);
  const [testimonials, ctx] = await Promise.all([
    getPublishedTestimonials(),
    loadTestimonialContext(),
  ]);
  const siteUrl = getSiteUrl();

  const filtered = testimonials.filter((t) => {
    const service = t.serviceId ? ctx.serviceById.get(t.serviceId) : undefined;
    const place = t.clientLocationId ? ctx.placeById.get(t.clientLocationId) : undefined;
    if (activeService && service?.slug !== activeService) return false;
    if (activeRegion && place?.country.slug !== activeRegion) return false;
    return true;
  });
  const hasPlaceholders = testimonials.some((t) => t.isPlaceholder);
  const real = reviewable(testimonials);
  const reviews = real
    .map((t) =>
      reviewSchema(
        {
          testimonial: t,
          serviceName: t.serviceId ? ctx.serviceById.get(t.serviceId)?.name : undefined,
        },
        siteUrl,
      ),
    )
    .filter((r) => r !== null);
  const aggregate = aggregateRatingSchema(testimonials, siteUrl);
  const isFiltered = Boolean(activeService || activeRegion);

  return (
    <>
      {reviews.length ? (
        <JsonLd data={aggregate ? [...reviews, aggregate] : reviews} id="review-schema" />
      ) : null}
      <PageHero
        eyebrow={TESTIMONIALS_HERO.eyebrow}
        title={TESTIMONIALS_HERO.title}
        lede={TESTIMONIALS_HERO.lede}
        motif="lines"
        breadcrumbs={[{ name: "Client experiences", href: "/testimonials" }]}
        actions={
          <Button asChild variant="gold-outline" size="lg">
            <Link href={TESTIMONIALS_LIST.shareLink.href}>{TESTIMONIALS_LIST.shareLink.label}</Link>
          </Button>
        }
      />
      <Container size="wide">
        <Byline
          datePublished={TESTIMONIALS_DATES.published}
          dateModified={TESTIMONIALS_DATES.modified}
        />
      </Container>

      <QuestionSection
        route="/testimonials"
        id={TESTIMONIALS_INTRO.id}
        eyebrow={TESTIMONIALS_INTRO.eyebrow}
        question={TESTIMONIALS_INTRO.question}
        answer={TESTIMONIALS_INTRO.answer}
        bodyClassName="max-w-prose"
      >
        {TESTIMONIALS_INTRO.body.map((p) => (
          <p key={p} className="leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </QuestionSection>

      <QuestionSection
        route="/testimonials"
        id={TESTIMONIALS_LIST.id}
        eyebrow={TESTIMONIALS_LIST.eyebrow}
        question={TESTIMONIALS_LIST.question}
        answer={TESTIMONIALS_LIST.answer}
        tone="muted"
      >
        {testimonials.length ? (
          <TestimonialFilters
            services={ctx.services}
            regions={ctx.regions}
            activeService={activeService}
            activeRegion={activeRegion}
          />
        ) : null}

        {hasPlaceholders ? (
          <Callout variant="warn" title={TESTIMONIALS_PLACEHOLDER.title}>
            {TESTIMONIALS_PLACEHOLDER.note}
          </Callout>
        ) : null}

        {testimonials.length === 0 ? (
          <Callout variant="info" title={TESTIMONIALS_LIST.none.title}>
            {TESTIMONIALS_LIST.none.body}
          </Callout>
        ) : filtered.length === 0 ? (
          <Callout variant="info" title={TESTIMONIALS_LIST.empty.title}>
            {TESTIMONIALS_LIST.empty.body}{" "}
            <Link href="/testimonials#experiences" className="text-accent-strong">
              {TESTIMONIALS_LIST.filters.clear}
            </Link>
          </Callout>
        ) : (
          <ul
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            aria-live={isFiltered ? "polite" : undefined}
          >
            {filtered.map((t) => {
              const place = t.clientLocationId ? ctx.placeById.get(t.clientLocationId) : undefined;
              const service = t.serviceId ? ctx.serviceById.get(t.serviceId) : undefined;
              const placeName = place
                ? place.location.type === "country"
                  ? place.location.name
                  : `${place.location.name}, ${place.country.name}`
                : undefined;
              return (
                <li key={t.id}>
                  <TestimonialCard
                    testimonial={t}
                    placeName={placeName}
                    serviceName={service?.name}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <Button asChild variant="link" className="px-0">
          <Link href={TESTIMONIALS_LIST.shareLink.href}>{TESTIMONIALS_LIST.shareLink.label} →</Link>
        </Button>
      </QuestionSection>

      <FaqBlock
        route="/testimonials"
        heading={TESTIMONIALS_FAQ.heading}
        answer={TESTIMONIALS_FAQ.answer}
        eyebrow={TESTIMONIALS_FAQ.eyebrow}
        items={[...TESTIMONIALS_FAQ.items]}
      />

      <CtaBand
        title="Had a consultation already?"
        body="If Astrologer Kavita has read your chart or reviewed your home, your words help the next person decide. Share them in any length; nothing is published without your permission."
        primaryHref="/share-your-experience"
        primaryLabel="Share your experience"
        secondaryHref="/book"
        secondaryLabel="Book a consultation"
        motif="compass"
      />
    </>
  );
}
