import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import {
  Byline,
  CtaDisc,
  FigureSection,
  Foot,
  More,
  SceneHero,
  Tablets,
} from "@/components/content";
import { AstronomicalLines } from "@/components/motifs";
import { JsonLd } from "@/components/seo/json-ld";
import { EyebrowPlate } from "@/components/testimonials/eyebrow-plate";
import { TestimonialFilters } from "@/components/testimonials/filters";
import { GhostLink } from "@/components/testimonials/ghost-link";
import { loadTestimonialContext } from "@/components/testimonials/resolve";
import { aggregateRatingSchema, reviewSchema, reviewable } from "@/components/testimonials/schema";
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

const ROUTE = "/testimonials";

const BASE_METADATA: Metadata = {
  title: { absolute: TESTIMONIALS_META.title },
  description: TESTIMONIALS_META.description,
  alternates: { canonical: ROUTE },
  openGraph: {
    type: "website",
    url: ROUTE,
    title: TESTIMONIALS_META.title,
    description: TESTIMONIALS_META.description,
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, ROUTE);
}

const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

/**
 * All client experiences (CLAUDE.md §12), in the redesign's language (SPEC §3): the orbital
 * linework as the scene, a quiet ruled plate on how experiences are collected, then Plate II:
 * its question and answer, the filters (plain links handled here on the server), the
 * placeholder warning unchanged so the production build gate still trips, and the experiences
 * themselves as levitating glass tablets. The questions sit in the foot; the parchment disc
 * closes the page. Review / AggregateRating JSON-LD only when at least one real, consented
 * testimonial exists.
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

  const items = filtered.map((t) => {
    const place = t.clientLocationId ? ctx.placeById.get(t.clientLocationId) : undefined;
    const service = t.serviceId ? ctx.serviceById.get(t.serviceId) : undefined;
    const placeName = place
      ? place.location.type === "country"
        ? place.location.name
        : `${place.location.name}, ${place.country.name}`
      : undefined;
    return { testimonial: t, placeName, serviceName: service?.name };
  });
  const single =
    testimonials.length === 0
      ? { title: TESTIMONIALS_LIST.none.title, body: TESTIMONIALS_LIST.none.body }
      : {
          title: TESTIMONIALS_LIST.empty.title,
          body: (
            <>
              {TESTIMONIALS_LIST.empty.body}{" "}
              <Link href="/testimonials#experiences" className="text-accent-strong">
                {TESTIMONIALS_LIST.filters.clear}
              </Link>
            </>
          ),
        };

  return (
    <>
      {reviews.length ? (
        <JsonLd data={aggregate ? [...reviews, aggregate] : reviews} id="review-schema" />
      ) : null}
      <SceneHero
        title={TESTIMONIALS_HERO.title}
        tagline={TESTIMONIALS_HERO.eyebrow}
        lede={TESTIMONIALS_HERO.lede}
        figureSize="wide"
        figureRatio="16/9"
        figure={<AstronomicalLines strokeWidth={0.8} className="text-accent-strong" />}
        breadcrumbs={[{ name: "Client experiences", href: ROUTE }]}
        actions={
          <GhostLink href={TESTIMONIALS_LIST.shareLink.href}>
            {TESTIMONIALS_LIST.shareLink.label}
          </GhostLink>
        }
      />
      <Container size="wide">
        <Byline
          datePublished={TESTIMONIALS_DATES.published}
          dateModified={TESTIMONIALS_DATES.modified}
          withoutPhoto
        />
      </Container>

      <EyebrowPlate eyebrow={TESTIMONIALS_INTRO.eyebrow}>
        <FigureSection
          route={ROUTE}
          id={TESTIMONIALS_INTRO.id}
          n="I"
          className="pt-6!"
          question={TESTIMONIALS_INTRO.question}
          answer={TESTIMONIALS_INTRO.answer}
        >
          <More>
            {TESTIMONIALS_INTRO.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </More>
        </FigureSection>
      </EyebrowPlate>

      <EyebrowPlate eyebrow={TESTIMONIALS_LIST.eyebrow} tone="muted">
        <FigureSection
          route={ROUTE}
          id={TESTIMONIALS_LIST.id}
          n="II"
          className="pt-6!"
          question={TESTIMONIALS_LIST.question}
          answer={TESTIMONIALS_LIST.answer}
        >
          {testimonials.length ? (
            <TestimonialFilters
              services={ctx.services}
              regions={ctx.regions}
              activeService={activeService}
              activeRegion={activeRegion}
            />
          ) : null}
          {/* Break out of the plate's 60ch column so the tablets keep their three-up grid. */}
          <div className="relative left-1/2 w-[min(76rem,calc(100vw-2rem))] -translate-x-1/2 space-y-8 pt-4">
            {hasPlaceholders ? (
              <Callout
                variant="warn"
                title={TESTIMONIALS_PLACEHOLDER.title}
                className="mx-auto max-w-[44rem]"
              >
                {TESTIMONIALS_PLACEHOLDER.note}
              </Callout>
            ) : null}
            <Tablets items={items} single={single} className={items.length ? "" : "mx-auto"} />
          </div>
          <p className="pt-4 text-center">
            <GhostLink href={TESTIMONIALS_LIST.shareLink.href}>
              {TESTIMONIALS_LIST.shareLink.label}
            </GhostLink>
          </p>
        </FigureSection>
      </EyebrowPlate>

      <Foot
        route={ROUTE}
        heading={TESTIMONIALS_FAQ.heading}
        answer={TESTIMONIALS_FAQ.answer}
        faqs={[...TESTIMONIALS_FAQ.items]}
      />

      <CtaDisc
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
