import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import type * as React from "react";
import {
  Byline,
  CtaDisc,
  FigureSection,
  Foot,
  GeoLinkLists,
  KeyFacts,
  Ledger,
  More,
  MotifSprite,
  SceneHero,
  ServiceList,
  StepLine,
  Toc,
} from "@/components/content";
import {
  Convergence,
  DashaRing,
  DashaTimeline,
  Disc,
  NorthIndianChart,
  Ornament,
  PLANETS,
  SouthIndianChart,
  TransitArc,
  VIMSHOTTARI_GRAHAS,
  VIMSHOTTARI_YEARS,
  dashaSegmentFractions,
} from "@/components/motifs";
import { Container } from "@/components/ui/container";
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

const ROUTE = "/astrology";

const BASE_METADATA: Metadata = {
  title: { absolute: ASTROLOGY_META.title },
  description: ASTROLOGY_META.description,
  alternates: { canonical: ROUTE, types: { "text/markdown": "/astrology.md" } },
  openGraph: {
    type: "website",
    url: ROUTE,
    title: ASTROLOGY_META.title,
    description: ASTROLOGY_META.description,
    siteName: "Astrologer Kavita",
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, ROUTE);
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

/**
 * `/astrology` hub — Vedic astrology intent (CLAUDE.md §5, §8, §9), in the voice of the home
 * page: the Vimshottari ring as the opening instrument, then plates — a figure, one ruled line,
 * the question-form H2 and its visible answer — with every longer paragraph folded into native
 * `<details>` beneath, the tables in ledgers, the honesty lists and the preparation list in
 * the open, the services and the published places as doors, the FAQs as the notes at the
 * foot. Server component: every word, every table and every link is in the HTML with
 * JavaScript disabled. Zero client JavaScript.
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
      <MotifSprite />

      <SceneHero
        id="astrology"
        title={ASTROLOGY_HERO.h1}
        tagline={ASTROLOGY_HERO.eyebrow}
        lede={ASTROLOGY_HERO.lede}
        entity={ASTROLOGY_HERO.entity}
        figureSize="half"
        figureRatio="1/1"
        breadcrumbs={[{ name: "Vedic astrology", href: ROUTE }]}
        figure={
          <div className="flex size-full flex-col items-center justify-center gap-4">
            <DashaRing className="min-h-0 w-auto max-w-full flex-1 text-accent-strong" />
            <DashaNames />
          </div>
        }
        actions={
          <>
            <Disc
              size="sm"
              href={ASTROLOGY_HERO.primaryCta.href}
              label={ASTROLOGY_HERO.primaryCta.label}
              className="[&_.disc-link]:text-[0.58rem]"
            />
            <Link href={ASTROLOGY_HERO.secondaryCta.href} className={GHOST}>
              {ASTROLOGY_HERO.secondaryCta.label}
              <span aria-hidden="true" data-arrow className="inline-block">
                →
              </span>
            </Link>
          </>
        }
      />

      <Container size="wide">
        <Byline
          datePublished={ASTROLOGY_DATES.published}
          dateModified={ASTROLOGY_DATES.modified}
          withoutPhoto
        />
      </Container>

      <KeyFacts route={ROUTE} heading={K.heading} items={facts} columns={3} />

      {/* Eleven labels: with plate numerals the rail overruns 1440 px, so the plates alone carry them. */}
      <Toc items={[...ASTROLOGY_TOC]} className="[&_a]:px-1 [&_a]:tracking-[0.14em]" />

      {/* Plate I — Vedic vs Western: a slow transit across the wheel */}
      <FigureSection
        {...plate(ASTROLOGY_WHAT, 0)}
        tone="muted"
        figureWidth="narrow"
        figureRatio="1/1"
        line={ASTROLOGY_WHAT.eyebrow}
        figure={<TransitArc className="text-accent-strong" />}
      >
        <Paragraphs section={ASTROLOGY_WHAT} />
        <Ledger table={ASTROLOGY_VS_WESTERN} open stack />
      </FigureSection>

      {/* Plate II — the kundli */}
      <FigureSection
        {...plate(ASTROLOGY_KUNDLI, 1)}
        figureWidth="default"
        line={ASTROLOGY_KUNDLI.eyebrow}
        figure={
          <div className="aspect-square w-full max-w-[20rem] text-accent-strong">
            <NorthIndianChart
              title={ASTROLOGY_CHART_MOTIFS.north.title}
              description={ASTROLOGY_CHART_MOTIFS.north.description}
              strokeWidth={0.9}
            />
          </div>
        }
      >
        <Paragraphs section={ASTROLOGY_KUNDLI} />
        <Ledger table={ASTROLOGY_KUNDLI_TABLE} stack />
      </FigureSection>

      {/* Plate III — dashas: the 120-year rule with nine unequal periods */}
      <FigureSection
        {...plate(ASTROLOGY_DASHAS, 2)}
        tone="muted"
        figureWidth="wide"
        line="120 years, nine periods"
        figure={
          <div className="w-full">
            <DashaTimeline tickEvery={10} travel className="text-accent-strong" />
            <DashaNames proportional />
          </div>
        }
      >
        <Paragraphs section={ASTROLOGY_DASHAS} />
      </FigureSection>

      {/* Plate IV — honest scope: both lists in the open */}
      <FigureSection {...plate(ASTROLOGY_ANSWERS, 3)}>
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          <RuledList heading={ASTROLOGY_CAN.heading} items={ASTROLOGY_CAN.items} />
          <RuledList heading={ASTROLOGY_CANNOT.heading} items={ASTROLOGY_CANNOT.items} />
        </div>
        <Paragraphs section={ASTROLOGY_ANSWERS} />
      </FigureSection>

      {/* Plate V — what to prepare: the list in the open */}
      <FigureSection {...plate(ASTROLOGY_PREPARE, 4)} tone="muted">
        <RuledList heading={ASTROLOGY_PREPARE_LIST.heading} items={ASTROLOGY_PREPARE_LIST.items} />
        <Paragraphs section={ASTROLOGY_PREPARE} />
      </FigureSection>

      {/* Plate VI — the reading, as steps on a ruled line */}
      <FigureSection {...plate(ASTROLOGY_PROCESS, 5)}>
        <StepLine steps={ASTROLOGY_STEPS.map((s) => ({ ...s }))} />
      </FigureSection>

      {/* Plate VII — two drawings of one chart */}
      <FigureSection
        {...plate(ASTROLOGY_CHART_STYLES, 6)}
        tone="muted"
        figureWidth="default"
        line={ASTROLOGY_CHART_STYLES.eyebrow}
        figure={<ChartStyles />}
      >
        <Paragraphs section={ASTROLOGY_CHART_STYLES} />
        <Ledger table={ASTROLOGY_CHART_STYLE_TABLE} stack />
      </FigureSection>

      {/* Plate VIII — the other instrument */}
      <FigureSection
        {...plate(ASTROLOGY_WITH_VASTU, 7)}
        figureWidth="wide"
        figureRatio="2/1"
        line={ASTROLOGY_WITH_VASTU.eyebrow}
        figure={<Convergence className="text-accent-strong" />}
      >
        <p className="text-center font-serif text-[1.05rem] leading-[1.5] text-muted-foreground italic">
          {ASTROLOGY_WITH_VASTU.closing}
        </p>
        <Paragraphs section={ASTROLOGY_WITH_VASTU} />
        <p className="text-center text-sm text-muted-foreground">
          Read the other instrument:{" "}
          <Link href="/vastu" className="text-accent-strong">
            vastu shastra, read together with your birth chart →
          </Link>
        </p>
      </FigureSection>

      {/* Plate IX — services as doors */}
      <FigureSection
        {...plate(ASTROLOGY_SERVICES, 8)}
        tone="muted"
        className="[&>div>div]:max-w-[64rem]"
      >
        <ServiceList services={own} allLink={ASTROLOGY_SERVICE_LABELS.allLink} />
      </FigureSection>

      {/* Plate X — where: country doors and the city list */}
      <FigureSection {...plate(ASTROLOGY_WHERE, 9)} className="[&>div>div]:max-w-[64rem]">
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
      </FigureSection>

      <Foot
        id="faq"
        route={ROUTE}
        heading={ASTROLOGY_FAQ.heading}
        answer={ASTROLOGY_FAQ.answer}
        faqs={[...ASTROLOGY_FAQ.items]}
      />

      <CtaDisc
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

/** The props every plate shares: anchor, route, numeral, question and answer. */
function plate(s: HubSection, i: number) {
  return { id: s.id, route: ROUTE, n: ROMAN[i], question: s.question, answer: s.answer };
}

/** A section's longer paragraphs, folded under its answer — in the HTML, not on the eye. */
function Paragraphs({ section }: { section: HubSection }) {
  if (!section.paragraphs?.length) return null;
  return (
    <More>
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </More>
  );
}

/** An honesty or preparation list: a Cinzel heading and ruled Cormorant items, always visible. */
function RuledList({ heading, items }: { heading: string; items: readonly string[] }) {
  return (
    <div>
      <h3 className="font-display text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
        {heading}
      </h3>
      <ul className="mt-3 divide-y divide-border/60 border-y border-border/60">
        {items.map((item) => (
          <li
            key={item.slice(0, 24)}
            className="flex gap-3 py-3 font-serif text-[1.05rem] leading-snug text-foreground"
          >
            <Ornament className="mt-1.5 size-3 shrink-0 text-accent-strong" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The nine periods named in HTML beneath a figure (never inside the SVG): an equal ruled row
 * under the ring in the hero, or sized to their segments under the timeline (`proportional`).
 * On a phone the names fall into a 3 × 3 grid rather than wrapping under the wrong segments.
 */
function DashaNames({ proportional = false }: { proportional?: boolean }) {
  const fractions = dashaSegmentFractions();
  return (
    <ol
      aria-label="The nine planetary periods and their lengths in years"
      className={
        proportional
          ? "mt-3 grid w-full grid-cols-3 gap-y-3 text-center sm:mt-1 sm:flex sm:gap-0"
          : "grid w-full shrink-0 grid-cols-3 gap-y-1.5 border-t border-accent-border/40 pt-3 text-center sm:flex sm:gap-0"
      }
    >
      {VIMSHOTTARI_GRAHAS.map((key, i) => {
        const f = fractions[i];
        return (
          <li
            key={key}
            className={
              proportional
                ? "sm:min-w-0 sm:[flex:0_0_calc(var(--w)*100%)] sm:px-1"
                : "flex items-baseline justify-center gap-1.5 sm:block sm:flex-1"
            }
            style={
              proportional
                ? ({ ["--w" as string]: f ? f.end - f.start : 0 } as React.CSSProperties)
                : undefined
            }
          >
            <span
              className={`font-display text-[0.62rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase ${proportional ? "block" : "sm:block"}`}
            >
              {PLANETS[key].name}
            </span>
            <span
              className={`font-serif text-sm leading-snug text-muted-foreground ${proportional ? "block" : "sm:block"}`}
            >
              {VIMSHOTTARI_YEARS[i]} yrs
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The same kundli drawn both ways, each captioned, side by side. */
function ChartStyles() {
  const caption =
    "mt-3 text-center font-display text-[0.62rem] font-semibold tracking-[0.22em] whitespace-nowrap text-muted-foreground uppercase";
  return (
    <div className="grid w-full grid-cols-2 gap-6 text-accent-strong sm:gap-10">
      <figure>
        <div className="aspect-square w-full">
          <NorthIndianChart
            title={ASTROLOGY_CHART_MOTIFS.north.title}
            description={ASTROLOGY_CHART_MOTIFS.north.description}
            strokeWidth={0.9}
          />
        </div>
        <figcaption className={caption}>North Indian</figcaption>
      </figure>
      <figure>
        <div className="aspect-square w-full">
          <SouthIndianChart
            title={ASTROLOGY_CHART_MOTIFS.south.title}
            description={ASTROLOGY_CHART_MOTIFS.south.description}
            strokeWidth={0.9}
          />
        </div>
        <figcaption className={caption}>South Indian</figcaption>
      </figure>
    </div>
  );
}
