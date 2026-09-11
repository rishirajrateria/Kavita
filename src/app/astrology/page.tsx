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
import { NorthIndianChart, Ornament, SouthIndianChart } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { HOME_PLACEHOLDERS } from "@/content/home";
import {
  ASTROLOGY_ANSWERS,
  ASTROLOGY_CAN,
  ASTROLOGY_CANNOT,
  ASTROLOGY_CHART_MOTIFS,
  ASTROLOGY_CHART_STYLES,
  ASTROLOGY_CHART_STYLE_TABLE,
  ASTROLOGY_CTA,
  ASTROLOGY_DASHAS,
  ASTROLOGY_DATES,
  ASTROLOGY_FAQ,
  ASTROLOGY_HERO,
  ASTROLOGY_KEY_FACTS,
  ASTROLOGY_KUNDLI,
  ASTROLOGY_KUNDLI_TABLE,
  ASTROLOGY_META,
  ASTROLOGY_PREPARE,
  ASTROLOGY_PREPARE_LIST,
  ASTROLOGY_PROCESS,
  ASTROLOGY_SERVICES,
  ASTROLOGY_SERVICE_LABELS,
  ASTROLOGY_STEPS,
  ASTROLOGY_TOC,
  ASTROLOGY_VS_WESTERN,
  ASTROLOGY_WHAT,
  ASTROLOGY_WHERE,
  ASTROLOGY_WHERE_LABELS,
  ASTROLOGY_WITH_VASTU,
  type HubSection,
} from "@/content/pages/astrology";
import { PRACTITIONER } from "@/content/practitioner";
import { getPublishableLocations, getServices, getSiteSettings } from "@/lib/data";
import { realValue } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: ASTROLOGY_META.title },
  description: ASTROLOGY_META.description,
  alternates: { canonical: "/astrology", types: { "text/markdown": "/astrology.md" } },
  openGraph: {
    type: "website",
    url: "/astrology",
    title: ASTROLOGY_META.title,
    description: ASTROLOGY_META.description,
    siteName: "Astrologer Kavita",
  },
};

/**
 * `/astrology` hub — Vedic astrology intent (CLAUDE.md §5, §8, §9). Server component: every
 * word in the HTML, tables for the facts answer engines extract, links to every astrology-led
 * and integrated service and to the published geo pages. Zero client JavaScript.
 */
export default async function AstrologyPage() {
  const [settings, services, publishable] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getPublishableLocations(),
  ]);
  const own = services.filter((s) => s.lead === "astrology" || s.lead === "integrated");
  const countries = publishable.filter((l) => l.type === "country");
  const featured = publishable.filter((l) => l.type === "city" && l.isFeatured);
  const cities = featured.length
    ? featured
    : publishable.filter((l) => l.type === "city").slice(0, 12);

  const durations = own.map((s) => s.durationMinutes);
  const min = durations.length ? Math.min(...durations) : 0;
  const max = durations.length ? Math.max(...durations) : 0;
  const practitioner = realValue(settings.practitionerName);
  const K = ASTROLOGY_KEY_FACTS;
  const inPerson = settings.inPersonAvailable
    ? K.modesInPerson(settings.city)
    : `${K.modesInPerson(settings.city)} (${HOME_PLACEHOLDERS.inPerson})`;
  const facts = [
    { label: K.labels.service, value: K.service },
    {
      label: K.labels.practitioner,
      value: practitioner ? `${practitioner} (Astrologer Kavita)` : "Astrologer Kavita",
    },
    { label: K.labels.system, value: K.system },
    { label: K.labels.inputs, value: K.inputs },
    { label: K.labels.modes, value: `${K.modesOnline}; ${inPerson}` },
    { label: K.labels.languages, value: PRACTITIONER.languages },
    { label: K.labels.sessionLength, value: K.sessionLength(min, max) },
    { label: K.labels.timezone, value: `${settings.timezone}; ${K.timezoneNote}` },
    { label: K.labels.responseTime, value: K.responseTime(settings.responseTimeHours) },
  ];

  return (
    <>
      <PageHero
        id="astrology"
        eyebrow={ASTROLOGY_HERO.eyebrow}
        title={ASTROLOGY_HERO.h1}
        lede={ASTROLOGY_HERO.lede}
        entity={ASTROLOGY_HERO.entity}
        motif="north-chart"
        breadcrumbs={[{ name: "Vedic astrology", href: "/astrology" }]}
        actions={<HeroActions {...ASTROLOGY_HERO} />}
      />

      <Toc items={[...ASTROLOGY_TOC]} />

      <Container size="wide" className="py-8">
        <Byline datePublished={ASTROLOGY_DATES.published} dateModified={ASTROLOGY_DATES.modified} />
      </Container>

      <KeyFacts heading={K.heading} items={facts} columns={3} />

      {/* 1. Vedic vs Western */}
      <QuestionSection {...props(ASTROLOGY_WHAT)} tone="default">
        <Paragraphs section={ASTROLOGY_WHAT} />
        <SpecTable table={ASTROLOGY_VS_WESTERN} />
      </QuestionSection>

      {/* 2. The kundli */}
      <QuestionSection {...props(ASTROLOGY_KUNDLI)} tone="muted">
        <Paragraphs section={ASTROLOGY_KUNDLI} />
        <SpecTable table={ASTROLOGY_KUNDLI_TABLE} />
      </QuestionSection>

      {/* 3. Dashas */}
      <QuestionSection {...props(ASTROLOGY_DASHAS)} tone="default">
        <Paragraphs section={ASTROLOGY_DASHAS} />
      </QuestionSection>

      {/* 4. What it answers — two panels on indigo */}
      <QuestionSection {...props(ASTROLOGY_ANSWERS)} tone="inverse">
        <Paragraphs section={ASTROLOGY_ANSWERS} />
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Panel heading={ASTROLOGY_CAN.heading} items={ASTROLOGY_CAN.items} />
          <Panel heading={ASTROLOGY_CANNOT.heading} items={ASTROLOGY_CANNOT.items} />
        </div>
      </QuestionSection>

      {/* 5. What to prepare */}
      <QuestionSection {...props(ASTROLOGY_PREPARE)} tone="default">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <Paragraphs section={ASTROLOGY_PREPARE} />
          <aside className="border-t border-accent-border/50 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <Heading
              as="h3"
              level={6}
              className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
            >
              {ASTROLOGY_PREPARE_LIST.heading}
            </Heading>
            <ul className="mt-4 space-y-3">
              {ASTROLOGY_PREPARE_LIST.items.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <Ornament className="mt-1.5 size-3.5 shrink-0 text-accent-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </QuestionSection>

      {/* 6. The reading process */}
      <QuestionSection {...props(ASTROLOGY_PROCESS)} tone="muted">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {ASTROLOGY_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-3 rounded-2xl border border-accent-border/30 bg-background p-6"
            >
              <span
                aria-hidden="true"
                className="font-serif text-3xl leading-none text-accent-strong tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <Heading as="h3" level={5}>
                {step.title}
              </Heading>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </QuestionSection>

      {/* 7. Chart styles, with both motifs */}
      <QuestionSection {...props(ASTROLOGY_CHART_STYLES)} tone="default">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-16">
          <Paragraphs section={ASTROLOGY_CHART_STYLES} />
          <div className="grid grid-cols-2 gap-6 pb-4 text-accent-strong">
            <figure className="space-y-3">
              <NorthIndianChart
                title={ASTROLOGY_CHART_MOTIFS.north.title}
                description={ASTROLOGY_CHART_MOTIFS.north.description}
                strokeWidth={0.9}
              />
              <figcaption className="text-center text-xs tracking-[0.1em] text-muted-foreground uppercase">
                North Indian
              </figcaption>
            </figure>
            <figure className="space-y-3">
              <SouthIndianChart
                title={ASTROLOGY_CHART_MOTIFS.south.title}
                description={ASTROLOGY_CHART_MOTIFS.south.description}
                strokeWidth={0.9}
              />
              <figcaption className="text-center text-xs tracking-[0.1em] text-muted-foreground uppercase">
                South Indian
              </figcaption>
            </figure>
          </div>
        </div>
        <SpecTable table={ASTROLOGY_CHART_STYLE_TABLE} />
      </QuestionSection>

      {/* 8. Adding vastu — the worked pattern on indigo */}
      <QuestionSection {...props(ASTROLOGY_WITH_VASTU)} tone="inverse">
        <div className="double-rule relative m-2 rounded-2xl border border-accent-border/50 bg-surface-inverse-deep/60 px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div className="flex justify-center text-accent-strong">
            <Ornament className="size-7" strokeWidth={1.1} />
          </div>
          <div className="mx-auto mt-6 max-w-[60ch] space-y-5 border-l-2 border-accent-border pl-5 font-serif text-[1.2rem] leading-[1.5] italic sm:pl-7 sm:text-[1.4rem]">
            {ASTROLOGY_WITH_VASTU.paragraphs?.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-prose border-t border-accent-border/40 pt-6 text-muted-foreground">
            {ASTROLOGY_WITH_VASTU.closing}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Read the other instrument:{" "}
          <Link href="/vastu" className="text-accent-strong">
            vastu shastra, read together with your birth chart →
          </Link>
        </p>
      </QuestionSection>

      {/* 9. Services */}
      <QuestionSection {...props(ASTROLOGY_SERVICES)} tone="default">
        <ServiceList services={own} allLink={ASTROLOGY_SERVICE_LABELS.allLink} />
      </QuestionSection>

      {/* 10. Where */}
      <QuestionSection {...props(ASTROLOGY_WHERE)} tone="muted">
        <GeoLinkLists
          service="astrologer"
          countries={countries}
          cities={cities}
          linkLabel={ASTROLOGY_WHERE_LABELS.linkLabel}
          headings={{
            countries: ASTROLOGY_WHERE_LABELS.countries,
            cities: ASTROLOGY_WHERE_LABELS.cities,
          }}
        />
      </QuestionSection>

      <FaqBlock
        id="faq"
        eyebrow={ASTROLOGY_FAQ.eyebrow}
        heading={ASTROLOGY_FAQ.heading}
        answer={ASTROLOGY_FAQ.answer}
        items={[...ASTROLOGY_FAQ.items]}
      />

      <CtaBand
        eyebrow={ASTROLOGY_CTA.eyebrow}
        title={ASTROLOGY_CTA.title}
        body={ASTROLOGY_CTA.body}
        primaryHref={ASTROLOGY_CTA.primary.href}
        primaryLabel={ASTROLOGY_CTA.primary.label}
        secondaryHref={ASTROLOGY_CTA.secondary.href}
        secondaryLabel={ASTROLOGY_CTA.secondary.label}
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

function HeroActions({
  primaryCta,
  secondaryCta,
}: {
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}) {
  return (
    <>
      <Button asChild variant="gold" size="xl">
        <Link href={primaryCta.href}>{primaryCta.label}</Link>
      </Button>
      <Button asChild variant="ghost" size="xl">
        <Link href={secondaryCta.href}>
          {secondaryCta.label}
          <span aria-hidden="true" data-arrow className="inline-block">
            →
          </span>
        </Link>
      </Button>
    </>
  );
}

function Panel({ heading, items }: { heading: string; items: readonly string[] }) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-accent-border/25 bg-card p-6 text-card-foreground sm:p-8">
      <Heading as="h3" level={3} tone="accent" className="max-w-[18ch]">
        {heading}
      </Heading>
      <ul className="space-y-3 border-t border-accent-border/30 pt-5 leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item.slice(0, 24)} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent-strong"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
