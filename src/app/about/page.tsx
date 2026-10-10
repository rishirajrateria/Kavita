import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import {
  Byline,
  CtaDisc,
  DoorField,
  FigureSection,
  Foot,
  More,
  MotifSprite,
  PortraitPlate,
  SceneHero,
  StepLine,
  Toc,
  hubHouseFor,
  type Door,
  type FootBlock,
  type TocItem,
} from "@/components/content";
import {
  Disc,
  EarthHorizon,
  Instrument,
  NorthIndianChart,
  Ornament,
  VastuCompass,
  type PlanetKey,
} from "@/components/motifs";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import {
  ABOUT_CTA,
  ABOUT_DATES,
  ABOUT_EXPERIENCE,
  ABOUT_FAQ,
  ABOUT_HERO,
  ABOUT_LANGUAGES,
  ABOUT_LIMITS,
  ABOUT_META,
  ABOUT_METHOD,
  ABOUT_NOT_CLAIMED,
  ABOUT_SESSION,
  ABOUT_TOC_LABELS,
  ABOUT_TRAINING,
  ABOUT_TRAINING_LABELS,
  ABOUT_WHERE,
  ABOUT_WHERE_LINKS,
  type AboutSection,
} from "@/content/pages/about";
import { PRACTITIONER, realAlumniOf, realAwards } from "@/content/practitioner";
import {
  getPublishableLocations,
  getSameAsUrls,
  getSiteSettings,
  locationHref,
  type Location,
} from "@/lib/data";
import { personSchema } from "@/lib/seo/schema";
import { getSiteUrl, isPlaceholder, realValue } from "@/lib/site";
import { cn } from "@/lib/utils";

const ROUTE = "/about";

const BASE_METADATA: Metadata = {
  title: { absolute: ABOUT_META.title },
  description: ABOUT_META.description,
  alternates: { canonical: ROUTE, types: { "text/markdown": "/about.md" } },
  openGraph: {
    type: "profile",
    url: ROUTE,
    title: ABOUT_META.title,
    description: ABOUT_META.description,
    siteName: "Astrologer Kavita",
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, ROUTE);
}

/** The plates in DOM order, numbered; the foot's notes and the FAQ follow unnumbered. */
const TOC_IDS: readonly (keyof typeof ABOUT_TOC_LABELS)[] = [
  "training",
  "method",
  "session",
  "limits",
  "not-claimed",
  "where", // the plates, I–VI
  "experience",
  "languages",
  "faq",
];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const TOC: TocItem[] = TOC_IDS.map((id, i) => ({ id, text: ABOUT_TOC_LABELS[id], n: NUMERALS[i] }));

/** On a phone the portrait stands clear below the tagline. */
const HERO_FIT = "max-sm:[&_.scene-figure]:mt-12";

/** A fold's summary sits centred under the centred H2 and answer of its plate. */
const CENTRED_FOLD = "[&>summary]:justify-center";

const HUB_LINKS = [
  ["/astrology", "Vedic astrology"],
  ["/vastu", "Vastu shastra"],
  ["/services", "Services"],
] as const;

const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

/**
 * `/about` — the E-E-A-T anchor (CLAUDE.md §8, §9.9), set as plates in the voice of the home
 * page. A Server Component; every word, link and answer is in the HTML. Credentials, years and
 * counts stay the practitioner's placeholders until supplied; Person JSON-LD carries only real
 * values.
 */
export default async function AboutPage() {
  const siteUrl = getSiteUrl();
  const [settings, sameAs, publishable] = await Promise.all([
    getSiteSettings(),
    getSameAsUrls(),
    getPublishableLocations(),
  ]);
  const countries = publishable.filter((l) => l.type === "country");
  const name = settings.practitionerName;
  const languages = realValue(PRACTITIONER.languages)?.split(/,\s*/).filter(Boolean);
  // The planet of place: the house of the hub that opens this page (the 9th, the teacher).
  const planet = hubHouseFor(ROUTE)?.planet;

  const person = personSchema({
    settings,
    sameAs,
    siteUrl,
    alumniOf: realAlumniOf(),
    awards: realAwards(),
    languages,
  });

  const footBlocks: FootBlock[] = [
    { ...ABOUT_EXPERIENCE, children: <Paragraphs section={ABOUT_EXPERIENCE} centred={false} /> },
    { ...ABOUT_LANGUAGES, children: <Paragraphs section={ABOUT_LANGUAGES} centred={false} /> },
  ];

  return (
    <>
      <JsonLd data={person} id="about-person" />
      <MotifSprite />

      <SceneHero
        id="about"
        title={ABOUT_HERO.h1}
        tagline={ABOUT_HERO.eyebrow}
        lede={ABOUT_HERO.lede(name, settings.city, settings.country, settings.inPersonAvailable)}
        entity={ABOUT_HERO.entity}
        figureSize="half"
        figureRatio="1/1"
        breadcrumbs={[{ name: "About", href: ROUTE }]}
        className={HERO_FIT}
        figure={<Portrait name={name} planet={planet} />}
        actions={
          <>
            {/* `md`: the label's capitals need the 8 rem face; the ring overflows it, hence my-6. */}
            <Disc
              size="md"
              href={ABOUT_HERO.primaryCta.href}
              label={ABOUT_HERO.primaryCta.label}
              className="my-6"
            />
            <Link href={ABOUT_HERO.secondaryCta.href} className={cn(GHOST, "sm:ms-6")}>
              {ABOUT_HERO.secondaryCta.label}
              <span aria-hidden="true" data-arrow className="inline-block">
                →
              </span>
            </Link>
          </>
        }
      />

      <Container size="wide" className="pb-6">
        <Byline
          datePublished={ABOUT_DATES.published}
          dateModified={ABOUT_DATES.modified}
          withoutPhoto
        />
      </Container>

      {/* Not sticky: a rail under the header would cover each plate's numeral on a jump. */}
      <Toc items={TOC} sticky={false} />

      {/* Plate I — the two instruments she trained in; the credentials ledger under the answer. */}
      <FigureSection
        {...plate(ABOUT_TRAINING)}
        n="I"
        tone="muted"
        figureWidth="narrow"
        figureRatio="2/1"
        figure={<TwoInstruments />}
        line={ABOUT_TRAINING.eyebrow}
      >
        <Credentials />
        <Paragraphs section={ABOUT_TRAINING} closing />
      </FigureSection>

      {/* Plate II — the method as six steps on a ruled line; the bodies fold beneath. */}
      <FigureSection
        {...plate(ABOUT_METHOD)}
        n="II"
        figureWidth="default"
        figure={<StepLine steps={ABOUT_METHOD.steps?.map(({ title }) => ({ title })) ?? []} />}
        line={ABOUT_METHOD.eyebrow}
      >
        <More summary="The steps in full" className={CENTRED_FOLD}>
          <ol>
            {ABOUT_METHOD.steps?.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p className="mt-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </More>
      </FigureSection>

      {/* Plate III — a session: the chart over the mandala. */}
      <FigureSection
        {...plate(ABOUT_SESSION)}
        n="III"
        tone="muted"
        figureWidth="narrow"
        figure={
          <div className="w-full max-w-[22rem]">
            <Instrument strokeWidth={1.1} />
          </div>
        }
        line="Chart, then home, then both"
      >
        <Paragraphs section={ABOUT_SESSION} />
      </FigureSection>

      {/* Plate IV — her view of the practice: the answer at rest, the paragraphs folded (SPEC §3). */}
      <FigureSection {...plate(ABOUT_LIMITS)} n="IV">
        <Paragraphs section={ABOUT_LIMITS} centred={false} />
      </FigureSection>

      {/* Plate V — plainly stated. The five items and the closing line stay visible. */}
      <FigureSection {...plate(ABOUT_NOT_CLAIMED)} n="V" tone="muted">
        <ul className="divide-y divide-accent-border/40 border-y border-accent-border/40">
          {ABOUT_NOT_CLAIMED.list?.map((item) => (
            <li
              key={item.slice(0, 32)}
              className="flex gap-4 py-4 font-serif text-[1.1rem] leading-[1.5] text-foreground"
            >
              <Ornament className="mt-1.5 size-4 shrink-0 text-accent-strong" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {ABOUT_NOT_CLAIMED.closing ? (
          <p className="font-serif text-[1.05rem] leading-[1.55] text-muted-foreground">
            {ABOUT_NOT_CLAIMED.closing}
          </p>
        ) : null}
      </FigureSection>

      {/* Plate VI — the Earth, and a door to every country she consults in. */}
      <FigureSection
        {...plate(ABOUT_WHERE)}
        n="VI"
        figureWidth="wide"
        figureRatio="2/1"
        figure={<Earth />}
        line={ABOUT_WHERE.eyebrow}
      >
        <Paragraphs section={ABOUT_WHERE} />
        <h3 className="pt-4 text-center font-display text-[0.62rem] font-semibold tracking-[0.3em] text-accent-strong uppercase">
          {ABOUT_WHERE_LINKS.heading}
        </h3>
        <CountryDoors countries={countries} />
        <p className="text-center text-sm text-muted-foreground">
          Hubs:{" "}
          {HUB_LINKS.map(([href, text], i) => (
            <span key={href}>
              {i > 0 ? " · " : null}
              <Link href={href} className="text-accent-strong">
                {text}
              </Link>
            </span>
          ))}
        </p>
      </FigureSection>

      <Foot
        id="faq"
        route={ROUTE}
        heading={ABOUT_FAQ.heading}
        answer={ABOUT_FAQ.answer}
        blocks={footBlocks}
        faqs={[...ABOUT_FAQ.items]}
      />

      <CtaDisc
        route={ROUTE}
        eyebrow={ABOUT_CTA.eyebrow}
        title={ABOUT_CTA.title}
        body={ABOUT_CTA.body}
        primaryHref={ABOUT_CTA.primary.href}
        primaryLabel={ABOUT_CTA.primary.label}
        secondaryHref={ABOUT_CTA.secondary.href}
        secondaryLabel={ABOUT_CTA.secondary.label}
      />
    </>
  );
}

function plate(s: AboutSection) {
  return { id: s.id, route: ROUTE, question: s.question, answer: s.answer };
}

/** A section's paragraphs (and closing line) folded under its answer — in the HTML, off the eye. */
function Paragraphs({
  section,
  closing = false,
  centred = true,
}: {
  section: AboutSection;
  closing?: boolean;
  /** False under a left-aligned block (a figureless plate, a note in the foot). */
  centred?: boolean;
}) {
  if (!section.paragraphs?.length && !(closing && section.closing)) return null;
  return (
    <More className={centred ? CENTRED_FOLD : undefined}>
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
      {closing && section.closing ? (
        <p className="border-t border-accent-border/30 pt-5">{section.closing}</p>
      ) : null}
    </More>
  );
}

/**
 * The portrait as the hero's figure, fitted to the square box's height with container units
 * (the image is 4:5; glass and caption take ~10 rem), capped at 22 rem; 11 rem on a phone, so
 * the caption keeps its full type size.
 */
function Portrait({ name, planet }: { name: string; planet: PlanetKey | undefined }) {
  return (
    <div className="[container-type:size] flex h-full w-full items-center justify-center">
      <PortraitPlate
        name={name}
        planet={planet}
        priority
        className="w-[min(22rem,calc((100cqh_-_10rem)/1.25))] max-w-[22rem] max-sm:w-[11rem]"
      />
    </div>
  );
}

/** Plate I's credentials, exactly as supplied; a placeholder shows what it awaits. Never folded. */
function Credentials() {
  return (
    <div className="w-full">
      <h3 className="text-center font-display text-[0.62rem] font-semibold tracking-[0.3em] text-accent-strong uppercase">
        {ABOUT_TRAINING_LABELS.listHeading}
      </h3>
      <dl className="mt-5 divide-y divide-accent-border/40 border-y border-accent-border/40">
        {PRACTITIONER.credentials.map((c) => (
          <div
            key={c.label}
            className="grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
          >
            <dt className="font-display text-[0.62rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {c.label}
            </dt>
            <dd className="font-serif text-[1.1rem] leading-snug text-foreground">
              {c.value}
              {isPlaceholder(c.value) ? (
                <span className="mt-1 block font-sans text-[0.8rem] leading-relaxed text-muted-foreground">
                  {ABOUT_TRAINING_LABELS.pending}: {c.usedFor}.
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The two instruments she trained to read — the North Indian chart and the vastu compass. */
function TwoInstruments() {
  return (
    <div className="grid w-full grid-cols-2 items-center gap-[8%] px-[6%] text-accent-strong">
      <NorthIndianChart strokeWidth={0.9} />
      <VastuCompass hideLabels strokeWidth={0.9} />
    </div>
  );
}

/** One elliptical fade, so no edge of the 2:1 frame survives on any side. */
const EARTH_MASK = "radial-gradient(ellipse 52% 62% at 50% 38%, black 45%, transparent 100%)";

/**
 * Plate VI's figure: by night the home hero's Earth, its dome raised into the frame; by day
 * (`EarthHorizon` is night-only) the same horizon engraved in brass hairlines and points.
 */
function Earth() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[2/1] w-full overflow-hidden"
      style={{ maskImage: EARTH_MASK, WebkitMaskImage: EARTH_MASK }}
    >
      <div className="hidden dark:block">
        <EarthHorizon className="top-[16%] bottom-auto -left-[10%] w-[120%] max-w-none md:top-[16%] md:bottom-auto md:-left-[10%] md:w-[120%]" />
      </div>
      <EngravedHorizon className="absolute inset-0 size-full text-accent-strong dark:hidden" />
    </div>
  );
}

/** City lights along the engraved rim: a fixed, even scatter (no data, no randomness). */
const RIM_LIGHTS = Array.from({ length: 23 }, (_, i) => {
  const a = ((-150 + i * 5.5) * Math.PI) / 180;
  const r = 576 - (i % 3) * 6;
  return { x: 500 + r * Math.cos(a), y: 696 + r * Math.sin(a), big: i % 4 === 0 };
});

/** The day horizon. Rims in screen pixels (`non-scaling-stroke`), points larger on a phone. */
function EngravedHorizon({ className }: { className?: string }) {
  const ring = { cx: 500, cy: 696, vectorEffect: "non-scaling-stroke" } as const;
  return (
    <svg viewBox="0 0 1000 500" fill="none" stroke="currentColor" className={className}>
      <circle {...ring} r="626" strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />
      <g opacity="0.4">
        <circle {...ring} r="604" strokeWidth="1" data-breathe />
      </g>
      <circle {...ring} r="588" strokeWidth="1.25" pathLength={1400} data-draw />
      <circle {...ring} r="520" strokeWidth="1" opacity="0.3" />
      <RimLights scale={1} className="max-sm:hidden" />
      <RimLights scale={2.6} className="sm:hidden" />
    </svg>
  );
}

function RimLights({ scale, className }: { scale: number; className: string }) {
  return (
    <g fill="currentColor" stroke="none" className={className}>
      {RIM_LIGHTS.map((l) => (
        <circle
          key={`${l.x.toFixed(1)}-${l.y.toFixed(1)}`}
          cx={l.x}
          cy={l.y}
          r={(l.big ? 2.4 : 1.4) * scale}
          opacity={l.big ? 0.8 : 0.5}
        />
      ))}
    </g>
  );
}

/** A door for each country, twice: to her astrology page there and to her vastu page there. */
function CountryDoors({ countries }: { countries: Location[] }) {
  if (countries.length === 0) return null;
  const door = (loc: Location, service: "astrologer" | "vastu-consultant"): Door => ({
    href: locationHref(loc, service),
    label: loc.name,
    line:
      service === "astrologer" ? ABOUT_WHERE_LINKS.astrologerLabel : ABOUT_WHERE_LINKS.vastuLabel,
    motif: service === "astrologer" ? "north-chart" : "compass",
  });
  const doors = countries.flatMap((loc) => [
    door(loc, "astrologer"),
    door(loc, "vastu-consultant"),
  ]);
  // One row per country at every width: the station field is one column below 48 rem.
  return (
    <DoorField
      doors={doors}
      variant="station"
      columns={2}
      className="border-b border-border/60 max-md:grid-cols-2! max-md:gap-x-4!"
    />
  );
}
