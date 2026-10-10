import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import type * as React from "react";
import {
  Byline,
  CompassDoors,
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
  SpecTable,
  Toc,
  type CompassCorner,
  type SpecTableData,
  type VastuElement,
} from "@/components/content";
import { Convergence, FloorPlan, VastuCompass, VastuDirections } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { GLOSSARY } from "@/content/glossary";
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

const ROUTE = "/vastu";

const BASE_METADATA: Metadata = {
  title: { absolute: VASTU_META.title },
  description: VASTU_META.description,
  alternates: { canonical: ROUTE, types: { "text/markdown": "/vastu.md" } },
  openGraph: {
    type: "website",
    url: ROUTE,
    title: VASTU_META.title,
    description: VASTU_META.description,
    siteName: "Astrologer Kavita",
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, ROUTE);
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"] as const;

const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

const CAPTION =
  "font-display text-[0.62rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase";

/**
 * The four corners of the plan and the element the classical scheme seats in each (the
 * direction table: north-east water, south-east fire, south-west earth, north-west air), each
 * opening its own glossary term.
 */
const CORNERS: readonly { dir: CompassCorner["dir"]; slug: string; element: VastuElement }[] = [
  { dir: "NE", slug: "ishaan", element: "water" },
  { dir: "SE", slug: "agneya", element: "fire" },
  { dir: "SW", slug: "nairutya", element: "earth" },
  { dir: "NW", slug: "vayavya", element: "air" },
];

/** Resolve each corner from `GLOSSARY` at build time; a missing term fails the build. */
function compassCorners(): CompassCorner[] {
  return CORNERS.map(({ dir, slug, element }) => {
    const term = GLOSSARY.find((t) => t.slug === slug);
    if (!term) throw new Error(`/vastu: glossary term "${slug}" is missing for the ${dir} door`);
    return {
      dir,
      href: `/glossary/${term.slug}`,
      label: term.term,
      sanskrit: term.term.split(" (")[0] ?? term.term,
      element,
    };
  });
}

/**
 * `/vastu` hub — vastu intent (CLAUDE.md §5, §8, §9), in the voice of the home page: the compass
 * whose four corners open their own terms as the opening instrument, the parchment disc at its
 * centre; then plates — a figure, one ruled line, the question-form H2 and its visible answer —
 * with every longer paragraph folded into native `<details>` beneath, the three tables in
 * ledgers (the directions open), the services and the published places as doors, the FAQs as
 * the notes at the foot. Server component: every word, every table and every link is in the
 * HTML with JavaScript disabled. Zero client JavaScript.
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
      <MotifSprite />

      <SceneHero
        id="vastu"
        title={VASTU_HERO.h1}
        tagline={VASTU_HERO.eyebrow}
        lede={VASTU_HERO.lede}
        entity={VASTU_HERO.entity}
        figureSize="half"
        figureRatio="1/1"
        breadcrumbs={[{ name: "Vastu shastra", href: ROUTE }]}
        figure={
          <CompassDoors
            corners={compassCorners()}
            centre={{
              href: VASTU_HERO.primaryCta.href,
              label: VASTU_HERO.primaryCta.label,
              title: VASTU_HERO.primaryCta.label,
            }}
            className="mx-auto max-h-full max-w-full [&_.disc-link]:text-[0.58rem] md:[&_[data-corner]]:max-w-none md:[&_[data-corner]]:whitespace-nowrap"
          />
        }
        actions={
          <Link href={VASTU_HERO.secondaryCta.href} className={GHOST}>
            {VASTU_HERO.secondaryCta.label}
            <span aria-hidden="true" data-arrow className="inline-block">
              →
            </span>
          </Link>
        }
      />

      <Container size="wide">
        <Byline
          datePublished={VASTU_DATES.published}
          dateModified={VASTU_DATES.modified}
          withoutPhoto
        />
      </Container>

      <KeyFacts route={ROUTE} heading={K.heading} items={facts} columns={3} />

      <Toc items={[...VASTU_TOC]} className="[&_a]:px-1 [&_a]:tracking-[0.14em]" />

      {/* Plate I — the mandala: nine zones, an element in each corner, the centre open */}
      <FigureSection
        {...plate(VASTU_WHAT, 0)}
        tone="muted"
        figureWidth="narrow"
        figureRatio="1/1"
        line="Nine zones, five elements"
        figure={<VastuDirections className="size-full text-accent-strong" />}
      >
        <Paragraphs section={VASTU_WHAT} />
      </FigureSection>

      {/* Plate II — the eight directions, and the table that names them (the primary table) */}
      <FigureSection
        {...plate(VASTU_DIRECTIONS, 1)}
        figureWidth="default"
        line={VASTU_DIRECTIONS.eyebrow}
        figure={
          <div className="aspect-square w-full max-w-[20rem] font-display text-accent-strong">
            <VastuCompass strokeWidth={0.9} />
          </div>
        }
      >
        <Paragraphs section={VASTU_DIRECTIONS} />
        <TableFold table={VASTU_DIRECTION_TABLE} firstColumnWidth="14%" open />
      </FigureSection>

      {/* Plate III — the brahmasthan: the plan with its centre lit */}
      <FigureSection
        {...plate(VASTU_BRAHMASTHAN, 2)}
        tone="muted"
        figureWidth="narrow"
        line={VASTU_BRAHMASTHAN.eyebrow}
        figure={
          <div className="aspect-square w-full max-w-[22rem] text-accent-strong">
            <FloorPlan highlight="centre" strokeWidth={1} />
          </div>
        }
      >
        <Paragraphs section={VASTU_BRAHMASTHAN} />
      </FigureSection>

      {/* Plate IV — remote: the bearing taken at the door, the how-to folded beneath */}
      <FigureSection
        {...plate(VASTU_REMOTE, 3)}
        figureWidth="default"
        line="A plan, a bearing, photographs"
        figure={
          <div
            data-sway
            className="aspect-square w-full max-w-[16rem] text-accent-strong"
            style={{ ["--sway-deg" as string]: "4deg" }}
          >
            <VastuCompass
              hideLabels
              strokeWidth={0.8}
              title="A compass rose for taking the bearing of the main entrance"
            />
          </div>
        }
      >
        <Paragraphs section={VASTU_REMOTE} />
        <More summary={VASTU_COMPASS_HOWTO.heading}>
          <p>{VASTU_COMPASS_HOWTO.intro}</p>
          <ol>
            {VASTU_COMPASS_HOWTO.steps.map((step) => (
              <li key={step.slice(0, 24)}>{step}</li>
            ))}
          </ol>
        </More>
        <p className="mx-auto max-w-[60ch] border-t border-accent-border/40 pt-5 text-center font-serif text-[1.05rem] leading-[1.5] text-muted-foreground italic">
          {VASTU_COMPASS_HOWTO.note}
        </p>
      </FigureSection>

      {/* Plate V — corrections: the south-west room, the corner most corrections turn on */}
      <FigureSection
        {...plate(VASTU_CORRECTIONS, 4)}
        tone="muted"
        figureWidth="narrow"
        line={VASTU_CORRECTIONS.eyebrow}
        figure={
          <div className="aspect-square w-full max-w-[22rem] text-accent-strong">
            <FloorPlan highlight="south-west" strokeWidth={1} />
          </div>
        }
      >
        <Paragraphs section={VASTU_CORRECTIONS} />
        <TableFold table={VASTU_CORRECTION_TABLE} firstColumnWidth="24%" />
      </FigureSection>

      {/* Plate VI — three kinds of premises, each a plan captioned by its column */}
      <FigureSection
        {...plate(VASTU_PROPERTY_TYPES, 5)}
        figureWidth="default"
        line={VASTU_PROPERTY_TYPES.eyebrow}
        figure={<PremisesPlans />}
      >
        <Paragraphs section={VASTU_PROPERTY_TYPES} />
        <TableFold table={VASTU_PROPERTY_TABLE} firstColumnWidth="16%" />
      </FigureSection>

      {/* Plate VII — the other instrument */}
      <FigureSection
        {...plate(VASTU_WITH_CHART, 6)}
        tone="muted"
        figureWidth="wide"
        figureRatio="2/1"
        line={VASTU_WITH_CHART.eyebrow}
        figure={<Convergence className="text-accent-strong" />}
      >
        <Paragraphs section={VASTU_WITH_CHART} />
        <p className="text-center text-sm text-muted-foreground">
          Read the other instrument:{" "}
          <Link href="/astrology" className="text-accent-strong">
            Vedic astrology, read together with the vastu of your home →
          </Link>
        </p>
      </FigureSection>

      {/* Plate VIII — services as doors */}
      <FigureSection {...plate(VASTU_SERVICES, 7)} className="[&>div>div]:max-w-[64rem]">
        <ServiceList services={own} />
      </FigureSection>

      {/* Plate IX — where: country doors and the city list */}
      <FigureSection {...plate(VASTU_WHERE, 8)} tone="muted" className="[&>div>div]:max-w-[64rem]">
        <GeoLinkLists
          service="vastu-consultant"
          countries={countries}
          cities={cities}
          linkLabel={VASTU_WHERE_LABELS.linkLabel}
          headings={{ countries: VASTU_WHERE_LABELS.countries, cities: VASTU_WHERE_LABELS.cities }}
        />
      </FigureSection>

      <Foot
        id="faq"
        route={ROUTE}
        heading={VASTU_FAQ.heading}
        answer={VASTU_FAQ.answer}
        faqs={[...VASTU_FAQ.items]}
      />

      <CtaDisc
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

/**
 * Lets a ledger of four or five columns break out of the plate's 60ch measure to the width a
 * table needs, centred on the page, while the folds above it keep the reading measure.
 */
function WideFold({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2">
      {children}
    </div>
  );
}

/**
 * A ledger whose table keeps the first-column width the page set before the redesign: `Ledger`
 * takes table data or an element, and only the element form lets `SpecTable` receive
 * `firstColumnWidth`, so the summary is composed here exactly as `Ledger` composes it.
 */
function TableFold({
  table,
  firstColumnWidth,
  open = false,
}: {
  table: SpecTableData;
  firstColumnWidth: string;
  open?: boolean;
}) {
  const clause = table.caption.split(/[.;:—]/)[0]?.trim() ?? table.caption;
  return (
    <WideFold>
      <Ledger
        open={open}
        summary={`Table · ${clause}`}
        table={<SpecTable table={table} firstColumnWidth={firstColumnWidth} />}
      />
    </WideFold>
  );
}

/** Three small plans, one per kind of premises, captioned with the property table's column heads. */
function PremisesPlans() {
  const heads = VASTU_PROPERTY_TABLE.columns.slice(1);
  return (
    <ul className="grid w-full grid-cols-3 gap-4 text-accent-strong sm:gap-10">
      {heads.map((head) => (
        <li key={head} className="flex flex-col items-center">
          <div className="aspect-square w-full max-w-[12rem]">
            <FloorPlan decorative strokeWidth={1.1} />
          </div>
          <span className={`mt-3 max-w-[14ch] text-center ${CAPTION}`}>{head}</span>
        </li>
      ))}
    </ul>
  );
}
