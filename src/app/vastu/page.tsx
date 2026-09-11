import type { Metadata } from "next";
import Link from "next/link";
import {
  Byline,
  CtaBand,
  FaqBlock,
  GeoLinkLists,
  KeyFacts,
  PageHero,
  QuestionSection,
  ServiceList,
  SpecTable,
  Toc,
} from "@/components/content";
import { Ornament, VastuCompass } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { HOME_PLACEHOLDERS } from "@/content/home";
import type { HubSection } from "@/content/pages/astrology";
import {
  VASTU_BRAHMASTHAN,
  VASTU_COMPASS_HOWTO,
  VASTU_CORRECTIONS,
  VASTU_CORRECTION_TABLE,
  VASTU_CTA,
  VASTU_DATES,
  VASTU_DIRECTIONS,
  VASTU_DIRECTION_TABLE,
  VASTU_FAQ,
  VASTU_HERO,
  VASTU_KEY_FACTS,
  VASTU_META,
  VASTU_PROPERTY_TABLE,
  VASTU_PROPERTY_TYPES,
  VASTU_REMOTE,
  VASTU_SERVICES,
  VASTU_TOC,
  VASTU_WHAT,
  VASTU_WHERE,
  VASTU_WHERE_LABELS,
  VASTU_WITH_CHART,
} from "@/content/pages/vastu";
import { PRACTITIONER } from "@/content/practitioner";
import { getPublishableLocations, getServices, getSiteSettings } from "@/lib/data";
import { realValue } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: VASTU_META.title },
  description: VASTU_META.description,
  alternates: { canonical: "/vastu", types: { "text/markdown": "/vastu.md" } },
  openGraph: {
    type: "website",
    url: "/vastu",
    title: VASTU_META.title,
    description: VASTU_META.description,
    siteName: "Astrologer Kavita",
  },
};

/**
 * `/vastu` hub — vastu intent (CLAUDE.md §5, §8, §9). Server component: every word in the
 * HTML, the directional table, the non-structural corrections table and the premises table,
 * links to every vastu-led and integrated service and to the published geo pages.
 */
export default async function VastuPage() {
  const [settings, services, publishable] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getPublishableLocations(),
  ]);
  const own = services.filter((s) => s.lead === "vastu" || s.lead === "integrated");
  const countries = publishable.filter((l) => l.type === "country");
  const featured = publishable.filter((l) => l.type === "city" && l.isFeatured);
  const cities = featured.length
    ? featured
    : publishable.filter((l) => l.type === "city").slice(0, 12);

  const durations = own.map((s) => s.durationMinutes);
  const min = durations.length ? Math.min(...durations) : 0;
  const max = durations.length ? Math.max(...durations) : 0;
  const practitioner = realValue(settings.practitionerName);
  const K = VASTU_KEY_FACTS;
  const onSite = settings.inPersonAvailable
    ? K.modesOnSite(settings.city)
    : `${K.modesOnSite(settings.city)} (${HOME_PLACEHOLDERS.inPerson})`;
  const facts = [
    { label: K.labels.service, value: K.service },
    {
      label: K.labels.practitioner,
      value: practitioner ? `${practitioner} (Astrologer Kavita)` : "Astrologer Kavita",
    },
    { label: K.labels.scope, value: K.scope },
    { label: K.labels.inputs, value: K.inputs },
    { label: K.labels.modes, value: `${K.modesRemote}; ${onSite}` },
    { label: K.labels.languages, value: PRACTITIONER.languages },
    { label: K.labels.sessionLength, value: K.sessionLength(min, max) },
    { label: K.labels.timezone, value: `${settings.timezone}; ${K.timezoneNote}` },
    { label: K.labels.responseTime, value: K.responseTime(settings.responseTimeHours) },
  ];

  return (
    <>
      <PageHero
        id="vastu"
        eyebrow={VASTU_HERO.eyebrow}
        title={VASTU_HERO.h1}
        lede={VASTU_HERO.lede}
        entity={VASTU_HERO.entity}
        motif="compass"
        breadcrumbs={[{ name: "Vastu shastra", href: "/vastu" }]}
        actions={
          <>
            <Button asChild variant="gold" size="xl">
              <Link href={VASTU_HERO.primaryCta.href}>{VASTU_HERO.primaryCta.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href={VASTU_HERO.secondaryCta.href}>
                {VASTU_HERO.secondaryCta.label}
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            </Button>
          </>
        }
      />

      <Toc items={[...VASTU_TOC]} />

      <Container size="wide" className="py-8">
        <Byline datePublished={VASTU_DATES.published} dateModified={VASTU_DATES.modified} />
      </Container>

      <KeyFacts heading={K.heading} items={facts} columns={3} />

      {/* 1. What vastu is */}
      <QuestionSection {...props(VASTU_WHAT)} tone="default">
        <Paragraphs section={VASTU_WHAT} />
      </QuestionSection>

      {/* 2. Directions table */}
      <QuestionSection {...props(VASTU_DIRECTIONS)} tone="muted">
        <Paragraphs section={VASTU_DIRECTIONS} />
        <SpecTable table={VASTU_DIRECTION_TABLE} firstColumnWidth="14%" />
      </QuestionSection>

      {/* 3. Brahmasthan, with the compass rose */}
      <QuestionSection {...props(VASTU_BRAHMASTHAN)} tone="default">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
          <Paragraphs section={VASTU_BRAHMASTHAN} />
          <figure className="mx-auto w-full max-w-[18rem] text-accent-strong lg:max-w-[22rem]">
            <VastuCompass
              title="Vastu compass rose"
              description="The eight directions of a vastu plan around an open centre, north at the top."
              strokeWidth={0.9}
            />
            <figcaption className="mt-3 text-center text-xs tracking-[0.1em] text-muted-foreground uppercase">
              Eight directions around the brahmasthan
            </figcaption>
          </figure>
        </div>
      </QuestionSection>

      {/* 4. Remote consultation + compass how-to on indigo */}
      <QuestionSection {...props(VASTU_REMOTE)} tone="inverse">
        <Paragraphs section={VASTU_REMOTE} />
        <article className="double-rule relative m-2 rounded-2xl border border-accent-border/50 bg-surface-inverse-deep/60 px-6 py-8 sm:px-10 sm:py-10">
          <Heading as="h3" level={3} tone="accent">
            {VASTU_COMPASS_HOWTO.heading}
          </Heading>
          <p className="mt-3 max-w-prose text-lg leading-relaxed text-muted-foreground">
            {VASTU_COMPASS_HOWTO.intro}
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VASTU_COMPASS_HOWTO.steps.map((step, i) => (
              <li
                key={step.slice(0, 24)}
                className="flex gap-4 rounded-xl border border-accent-border/25 bg-card p-5 text-card-foreground"
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-3xl leading-none text-accent-strong tabular-nums"
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-prose border-t border-accent-border/40 pt-5 text-sm text-muted-foreground">
            {VASTU_COMPASS_HOWTO.note}
          </p>
        </article>
      </QuestionSection>

      {/* 5. Corrections without construction */}
      <QuestionSection {...props(VASTU_CORRECTIONS)} tone="default">
        <Paragraphs section={VASTU_CORRECTIONS} />
        <SpecTable table={VASTU_CORRECTION_TABLE} firstColumnWidth="24%" />
      </QuestionSection>

      {/* 6. Property types */}
      <QuestionSection {...props(VASTU_PROPERTY_TYPES)} tone="muted">
        <Paragraphs section={VASTU_PROPERTY_TYPES} />
        <SpecTable table={VASTU_PROPERTY_TABLE} firstColumnWidth="16%" />
      </QuestionSection>

      {/* 7. Adding the chart */}
      <QuestionSection {...props(VASTU_WITH_CHART)} tone="inverse">
        <div className="mx-auto max-w-[70ch] space-y-5 border-l-2 border-accent-border pl-5 font-serif text-[1.2rem] leading-[1.5] italic sm:pl-7 sm:text-[1.35rem]">
          {VASTU_WITH_CHART.paragraphs?.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
        <p className="mx-auto flex max-w-prose items-start gap-4 border-t border-accent-border/40 pt-6 text-muted-foreground">
          <Ornament className="mt-1.5 size-5 shrink-0 text-accent-strong" strokeWidth={1.1} />
          <span>
            Read the other instrument:{" "}
            <Link href="/astrology" className="text-accent-strong">
              Vedic astrology, read together with the vastu of your home →
            </Link>
          </span>
        </p>
      </QuestionSection>

      {/* 8. Services */}
      <QuestionSection {...props(VASTU_SERVICES)} tone="default">
        <ServiceList services={own} />
      </QuestionSection>

      {/* 9. Where */}
      <QuestionSection {...props(VASTU_WHERE)} tone="muted">
        <GeoLinkLists
          service="vastu-consultant"
          countries={countries}
          cities={cities}
          linkLabel={VASTU_WHERE_LABELS.linkLabel}
          headings={{ countries: VASTU_WHERE_LABELS.countries, cities: VASTU_WHERE_LABELS.cities }}
        />
      </QuestionSection>

      <FaqBlock
        id="faq"
        eyebrow={VASTU_FAQ.eyebrow}
        heading={VASTU_FAQ.heading}
        answer={VASTU_FAQ.answer}
        items={[...VASTU_FAQ.items]}
      />

      <CtaBand
        eyebrow={VASTU_CTA.eyebrow}
        title={VASTU_CTA.title}
        body={VASTU_CTA.body}
        primaryHref={VASTU_CTA.primary.href}
        primaryLabel={VASTU_CTA.primary.label}
        secondaryHref={VASTU_CTA.secondary.href}
        secondaryLabel={VASTU_CTA.secondary.label}
        motif="compass"
      />
    </>
  );
}

function props(s: HubSection) {
  return { id: s.id, eyebrow: s.eyebrow, question: s.question, answer: s.answer };
}

function Paragraphs({ section }: { section: HubSection }) {
  if (!section.paragraphs?.length) return null;
  return (
    <div className="max-w-[70ch] space-y-5 text-lg leading-relaxed">
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </div>
  );
}
