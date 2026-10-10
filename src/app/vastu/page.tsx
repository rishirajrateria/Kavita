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
import {
  Convergence,
  DIRECTIONS,
  FloorPlan,
  VastuCompass,
  VastuDirections,
} from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { GLOSSARY } from "@/content/glossary";
import { HOME_PLACEHOLDERS, HUB } from "@/content/home";
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

/** From `lg`: a two-line H1, a one-line tagline and a figure capped so South clears the fold. */
const HERO =
  "lg:[&_h1]:max-w-[26ch] lg:[&_.rule]:max-w-[56rem] lg:[&_.scene-figure]:max-w-[min(94vw,36rem,calc(100svh_-_24rem))]!";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"] as const;

const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

/** The four corners, each with the element the direction table seats there and its own term. */
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
    const sanskrit = term.term.split(" (")[0] ?? term.term;
    return { dir, href: `/glossary/${term.slug}`, label: term.term, sanskrit, element };
  });
}

/**
 * `/vastu` hub (CLAUDE.md §5, §8, §9) in the home page's voice: the compass doors, then plates —
 * figure, one line, question H2, visible answer, longer copy and tables folded in `<details>` —
 * then doors, notes and the disc. Server component; every word is in the HTML, zero client JS.
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
        className={HERO}
        figureRatio="1/1"
        breadcrumbs={[{ name: "Vastu shastra", href: ROUTE }]}
        figure={<HeroCompass corners={compassCorners()} />}
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
        line={VASTU_DIRECTIONS.eyebrow}
        figure={
          <div className="aspect-square w-full max-w-[20rem] font-display text-accent-strong">
            <VastuCompass strokeWidth={0.9} />
          </div>
        }
      >
        <Paragraphs section={VASTU_DIRECTIONS} />
        <TableFold table={VASTU_DIRECTION_TABLE} firstColumnWidth="14%" />
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
        line="A plan, a bearing, photographs"
        figure={<SwayingCompass />}
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
      <FigureSection {...plate(VASTU_PROPERTY_TYPES, 5)} figure={<Premises />}>
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

/** The props every plate shares; the fold stack takes the answer's measure (one left edge). */
function plate(s: HubSection, i: number) {
  const { id, question, answer } = s;
  return { id, route: ROUTE, n: ROMAN[i], question, answer, className: FOLD };
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

const FOLD = "[&>div>div]:max-w-[36rem]";

/**
 * Table body: breaks out to 64rem, cells in the §2.1 meta type. Between 40rem (where scene.css
 * stops stacking) and `lg` a `.plate-stack` table would scroll sideways, so there each row is its
 * header over a two-column ruled grid of labelled cells.
 */
const LEDGER = [
  "[&_td]:text-[0.8rem] [&_td]:leading-[1.6] [&_th[scope=row]]:text-base",
  "[&>div]:relative [&>div]:left-1/2 [&>div]:w-[min(64rem,calc(100vw-2rem))] [&>div]:-translate-x-1/2",
  "sm:max-lg:[&_.plate-stack]:block sm:max-lg:[&_.plate-stack_tbody]:block sm:max-lg:[&_.plate-stack_thead]:sr-only",
  "sm:max-lg:[&_.plate-stack_tr]:grid sm:max-lg:[&_.plate-stack_tr]:grid-cols-2 sm:max-lg:[&_.plate-stack_tr]:gap-x-8 sm:max-lg:[&_.plate-stack_tr]:py-3",
  "sm:max-lg:[&_.plate-stack_th]:col-span-2 sm:max-lg:[&_.plate-stack_th]:px-0 sm:max-lg:[&_.plate-stack_td]:px-0",
  "sm:max-lg:[&_.plate-stack_td]:before:block sm:max-lg:[&_.plate-stack_td]:before:content-[attr(data-label)]",
  "sm:max-lg:[&_.plate-stack_td]:before:font-display sm:max-lg:[&_.plate-stack_td]:before:text-[0.62rem] sm:max-lg:[&_.plate-stack_td]:before:font-semibold",
  "sm:max-lg:[&_.plate-stack_td]:before:tracking-[0.2em] sm:max-lg:[&_.plate-stack_td]:before:text-accent-strong sm:max-lg:[&_.plate-stack_td]:before:uppercase",
].join(" ");

/** A table folded under its plate (element form, so `SpecTable` takes `firstColumnWidth`). */
function TableFold({ table, ...widths }: { table: SpecTableData; firstColumnWidth: string }) {
  const clause = table.caption.split(/[.;:—]/)[0]?.trim() ?? table.caption;
  const body = <SpecTable table={table} {...widths} />;
  return <Ledger summary={`Table · ${clause}`} table={body} className={LEDGER} />;
}

const SWAY = { "--sway-deg": "6deg" } as React.CSSProperties;

/**
 * Plate IV (SPEC §4): the rose holds still and only a needle sways over it, on the same 200-unit
 * geometry — a page-local overlay, because `VastuCompass` has no needle group of its own.
 */
function SwayingCompass() {
  return (
    <div className="relative aspect-square w-full max-w-[12rem] text-accent-strong">
      <VastuCompass hideLabels strokeWidth={0.9} />
      <div data-sway aria-hidden="true" className="absolute inset-0" style={SWAY}>
        <svg viewBox="0 0 200 200" className="size-full" strokeWidth={0.9} strokeLinejoin="round">
          <path d="M100 40 104 100 96 100Z" fill="currentColor" stroke="currentColor" />
          <path d="M100 160 104 100 96 100Z" fill="none" stroke="currentColor" />
        </svg>
      </div>
    </div>
  );
}

/** A unit among others with its own entrance; a house on its plot; an open commercial floor. */
const PREMISES = [
  { frame: "grid grid-cols-2 border border-accent-border/50", zone: "east", w: 7 },
  { frame: "border border-accent-border/60 p-[18%]", zone: "none", w: 4.5 },
  { frame: "border-[3px] border-double border-accent-border/60 p-[7%]", zone: "centre", w: 3.5 },
] as const;

const UNIT =
  "border-dashed border-accent-border/40 p-[8%] [&:nth-child(-n+2)]:border-b [&:nth-child(odd)]:border-e";

/** Plate VI: the plan seated three ways, each captioned by the property table's column head. */
function Premises() {
  const heads = VASTU_PROPERTY_TABLE.columns.slice(1).map((h) => h.split(" (")[0] ?? h);
  return (
    <div className="grid w-full max-w-[40rem] grid-cols-3 gap-4 text-accent-strong sm:gap-8">
      {PREMISES.map(({ frame, zone, w }, i) => {
        const plan = <FloorPlan decorative highlight={zone} strokeWidth={w} />;
        return (
          <div key={heads[i]}>
            <div className={`aspect-square ${frame}`}>
              {i === 0
                ? [0, 1, 2, 3].map((c) => (
                    <div key={c} className={UNIT}>
                      {c === 1 ? plan : null}
                    </div>
                  ))
                : plan}
            </div>
            <p className="mt-3 text-center font-display text-[0.62rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {heads[i]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const CARDINAL_NAME: Record<string, string> = { N: "North", E: "East", S: "South", W: "West" };

/**
 * Around `CompassDoors` (no shared file touched): the disc label held at the 0.62rem floor; below
 * `lg` its labels are `sr-only` and `PhoneCompassLabels` draws them; from `lg` labels sit on one
 * line, east and west (6th and 8th spans) anchored by their inner edge (`!` beats doors.css).
 */
const HERO_COMPASS = [
  "max-h-full max-w-full",
  "max-lg:[&_.compass-label]:sr-only",
  "lg:[&_.compass-label]:max-w-none lg:[&_.compass-label]:whitespace-nowrap",
  "lg:[&>span:nth-of-type(6)]:[translate:0_-50%]! lg:[&>span:nth-of-type(8)]:[translate:-100%_-50%]!",
].join(" ");

/** The hero instrument: the compass doors, the disc at the centre (the hub's short label). */
function HeroCompass({ corners }: { corners: CompassCorner[] }) {
  return (
    <div className="relative mx-auto aspect-square max-h-full w-full max-w-full">
      <CompassDoors
        corners={corners}
        centre={{
          href: VASTU_HERO.primaryCta.href,
          label: HUB.centre.label,
          title: VASTU_HERO.primaryCta.label,
        }}
        className={HERO_COMPASS}
      />
      <PhoneCompassLabels corners={corners} />
    </div>
  );
}

const PHONE_LABEL =
  "absolute font-display text-[0.62rem] leading-[1.35] font-semibold tracking-[0.2em] whitespace-nowrap uppercase text-center";

/**
 * Compass labels below `lg` (decorative; the primitive's sr-only labels carry the words). Each
 * cardinal sits just outside the sky circle (38.64% of the box), east and west turned along the
 * rim; the corners sit in the box's corners, clear of it.
 */
function PhoneCompassLabels({ corners }: { corners: CompassCorner[] }) {
  const out = "calc(11.36% - 1.15rem)";
  const far = "calc(88.64% + 1.15rem)";
  const cardinal: Record<string, React.CSSProperties> = {
    N: { left: "50%", top: out, translate: "-50% -50%" },
    S: { left: "50%", top: far, translate: "-50% -50%" },
    E: { left: far, top: "50%", translate: "-50% -50%", rotate: "90deg" },
    W: { left: out, top: "50%", translate: "-50% -50%", rotate: "-90deg" },
  };
  const corner = ({ dir }: CompassCorner): React.CSSProperties => ({
    [dir.endsWith("E") ? "right" : "left"]: "0.25rem",
    top: dir.startsWith("N") ? "11.5%" : "88.5%",
    translate: "0 -50%",
  });
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 lg:hidden">
      {DIRECTIONS.filter((d) => d.label in CARDINAL_NAME).map((d) => (
        <span
          key={d.label}
          className={`${PHONE_LABEL} text-muted-foreground`}
          style={cardinal[d.label]}
        >
          {CARDINAL_NAME[d.label]}
          <br />
          {d.sanskrit}
        </span>
      ))}
      {corners.map((c) => (
        <span key={c.dir} className={`${PHONE_LABEL} text-foreground`} style={corner(c)}>
          {c.sanskrit}
          <br />
          {c.dir}
        </span>
      ))}
    </div>
  );
}
