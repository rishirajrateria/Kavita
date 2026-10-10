import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import {
  Byline,
  CtaDisc,
  DoorField,
  FigureSection,
  Foot,
  Ledger,
  More,
  SceneHero,
} from "@/components/content";
import {
  Convergence,
  FloorPlan,
  Instrument,
  KundliNav,
  NorthIndianChart,
} from "@/components/motifs";
import { ServicesComparisonTable } from "@/components/services/comparison-table";
import { servicePrice } from "@/components/services/price";
import { Container } from "@/components/ui/container";
import { HUB, INSTRUMENTS } from "@/content/home";
import {
  LEAD_DESCRIPTION,
  LEAD_LABEL,
  SERVICES_COMPARISON,
  SERVICES_CTA,
  SERVICES_DATES,
  SERVICES_FAQ,
  SERVICES_HERO,
  SERVICES_INTRO,
  SERVICES_LIST,
  SERVICES_META,
} from "@/content/pages/services";
import { getServices, type Service, type ServiceLead } from "@/lib/data";

const BASE_METADATA: Metadata = {
  title: { absolute: SERVICES_META.title },
  description: SERVICES_META.description,
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    url: "/services",
    title: SERVICES_META.title,
    description: SERVICES_META.description,
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/services");
}

const LEADS: ServiceLead[] = ["integrated", "astrology", "vastu"];

/**
 * Each lead's instrument over its label: both, the chart, or the plan. The strokes are thickened
 * in user units so the hairline reads as ~1 px at 8 rem.
 */
function LeadGlyph({ lead }: { lead: ServiceLead }) {
  const cls = "text-accent-strong";
  if (lead === "astrology")
    return <NorthIndianChart decorative strokeWidth={1.6} className={cls} />;
  if (lead === "vastu") return <FloorPlan decorative strokeWidth={3} className={cls} />;
  return <Instrument decorative strokeWidth={3} className={`${cls} ${DAY_MANDALA}`} />;
}

/** By day the Instrument's rings and grid are pale brass on parchment: carry them on the accent. */
const DAY_MANDALA =
  "[[data-theme=light]_&]:[--mandala-strong:color-mix(in_srgb,var(--accent-strong)_70%,transparent)] [[data-theme=light]_&]:[--mandala:color-mix(in_srgb,var(--accent-strong)_42%,transparent)]";

/**
 * Plate II's figure — the three leads the comparison table sorts by, as a ruled three-column
 * `<dl>`: the lead's instrument, then the Cinzel label and the Cormorant line. On a phone the
 * three stack, each instrument beside its words.
 */
function LeadColumns() {
  return (
    <dl className="mx-auto grid w-full max-w-[56rem] border-y border-accent-border/30 sm:grid-cols-3 sm:divide-x sm:divide-accent-border/30">
      {LEADS.map((lead) => (
        <div
          key={lead}
          className="grid grid-cols-[5.5rem_1fr] items-center gap-x-5 border-t border-accent-border/30 px-2 py-6 text-left first:border-t-0 sm:block sm:border-t-0 sm:px-4 sm:py-8 sm:text-center"
        >
          <dt className="contents font-display text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase sm:block">
            <div
              aria-hidden="true"
              className="row-span-2 size-[5.5rem] sm:mx-auto sm:mb-6 sm:size-32"
            >
              <LeadGlyph lead={lead} />
            </div>
            <span className="self-end">{LEAD_LABEL[lead]}</span>
          </dt>
          <dd className="mt-2 max-w-[22ch] self-start font-serif text-[1.05rem] leading-snug text-muted-foreground sm:mx-auto">
            {LEAD_DESCRIPTION[lead]}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The three Cinzel phrases under the Convergence figure, set exactly as the home page sets them. */
function ConvergenceLine() {
  return (
    <span className="inline-flex flex-col items-center gap-y-1.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3">
      <span className="whitespace-nowrap">{INSTRUMENTS.captions.chart}</span>
      <span aria-hidden="true" className="hidden opacity-60 sm:inline">
        ·
      </span>
      <span className="whitespace-nowrap text-accent-strong">{INSTRUMENTS.captions.together}</span>
      <span aria-hidden="true" className="hidden opacity-60 sm:inline">
        ·
      </span>
      <span className="whitespace-nowrap">{INSTRUMENTS.captions.home}</span>
    </span>
  );
}

/**
 * A door's meta from data — lead · minutes · price — with non-breaking spaces inside each part,
 * so a narrow tile wraps only at the separators, never mid-phrase.
 */
function doorMeta(s: Service): string {
  return [LEAD_LABEL[s.lead], `${s.durationMinutes} min`, servicePrice(s).text]
    .map((part) => part.replace(/ /g, "\u00a0"))
    .join(" · ");
}

/**
 * Plate III has no instrument — its doors are the pictures — so the quiet block is widened to
 * hold three columns, and its numeral, question and answer are centred like the plates above.
 */
const PLATE_III =
  "[&>div>div]:max-w-[64rem] [&_.plate-n]:text-center [&_h2]:mx-auto [&_h2]:text-center [&_.answer]:mx-auto [&_.answer]:max-w-[40rem] [&_.answer]:border-s-0 [&_.answer]:ps-0 [&_.answer]:text-center";

/** On a phone the doors sit two by two; an odd last door takes the whole row. */
const ODD_LAST = "max-md:[&>li:last-child:nth-child(odd)]:col-span-2";

/**
 * All services (CLAUDE.md §5) in the home hero's language: the chart is the door. The kundli hub
 * opens the page with every service in its house; then the plates — which to book first (the
 * Convergence figure: the integrated reading it recommends), the comparison ledger under the
 * three leads it sorts by, and the nine services again as HTML doors outside the SVG (each a real
 * `<a>` with its planet from `HUB`, in a `<nav>`), the questions, and the disc.
 * Static; no client JS; every answer block and link is in the served HTML.
 */
export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <SceneHero
        title={SERVICES_HERO.title}
        tagline={SERVICES_HERO.eyebrow}
        lede={SERVICES_HERO.lede}
        figure={<KundliNav houses={HUB.houses} centre={HUB.centre} />}
        figureSize="wide"
        figureRatio="3/2"
        breadcrumbs={[{ name: "Services", href: "/services" }]}
      />
      <Container size="wide">
        <Byline
          datePublished={SERVICES_DATES.published}
          dateModified={SERVICES_DATES.modified}
          withoutPhoto
        />
      </Container>

      <FigureSection
        id={SERVICES_INTRO.id}
        route="/services"
        n="I"
        question={SERVICES_INTRO.question}
        answer={SERVICES_INTRO.answer}
        figure={<Convergence className="text-accent-strong" />}
        line={<ConvergenceLine />}
        figureWidth="wide"
        figureRatio="2/1"
      >
        <More>
          {SERVICES_INTRO.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </More>
      </FigureSection>

      <FigureSection
        id={SERVICES_COMPARISON.id}
        route="/services"
        n="II"
        tone="muted"
        question={SERVICES_COMPARISON.question}
        answer={SERVICES_COMPARISON.answer}
        figure={<LeadColumns />}
        figureWidth="default"
        className="[&>div>div]:max-w-[64rem]"
      >
        <Ledger
          summary={`Table · ${SERVICES_COMPARISON.caption.split(":")[0]}`}
          table={<ServicesComparisonTable services={services} />}
        />
      </FigureSection>

      <FigureSection
        id={SERVICES_LIST.id}
        route="/services"
        n="III"
        question={SERVICES_LIST.question}
        answer={SERVICES_LIST.answer}
        className={PLATE_III}
      >
        <nav
          aria-label={SERVICES_LIST.eyebrow}
          data-placeholder={services.some((s) => servicePrice(s).placeholder) ? "price" : undefined}
        >
          <DoorField
            columns={3}
            className={ODD_LAST}
            doors={services.map((s) => ({
              href: `/services/${s.slug}`,
              label: s.name,
              line: s.shortDescription,
              meta: doorMeta(s),
            }))}
          />
        </nav>
        <p className="text-center font-serif text-[1.05rem] text-muted-foreground">
          Every service is available online worldwide.{" "}
          <Link href="/contact" className="text-accent-strong">
            Ask which fits
          </Link>{" "}
          if you are unsure.
        </p>
      </FigureSection>

      <Foot
        route="/services"
        heading={SERVICES_FAQ.heading}
        answer={SERVICES_FAQ.answer}
        faqs={[...SERVICES_FAQ.items]}
      />

      <CtaDisc
        title={SERVICES_CTA.title}
        body={SERVICES_CTA.body}
        primaryHref={SERVICES_CTA.primaryHref}
        primaryLabel={SERVICES_CTA.primaryLabel}
        secondaryHref={SERVICES_CTA.secondaryHref}
        secondaryLabel={SERVICES_CTA.secondaryLabel}
      />
    </>
  );
}
