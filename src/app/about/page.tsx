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
import { Disc, EarthHorizon, Instrument, Ornament, type PlanetKey } from "@/components/motifs";
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
const TOC: TocItem[] = (
  [
    ["training", "I"],
    ["method", "II"],
    ["session", "III"],
    ["limits", "IV"],
    ["not-claimed", "V"],
    ["where", "VI"],
    ["experience"],
    ["languages"],
    ["faq"],
  ] as const
).map(([id, n]) => ({ id, text: ABOUT_TOC_LABELS[id], n }));

const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

/**
 * `/about` — the E-E-A-T anchor (CLAUDE.md §8, §9.9), set as plates in the voice of the home
 * page: the practitioner's portrait as the opening figure, her credentials as a ruled ledger,
 * the method on a step line, the Instrument, the two honesty blocks visible in full, the Earth
 * with a door to every country, then the notes to the plates and the parchment disc. A Server
 * Component; every word, link and answer is in the HTML. The entity sentence is the first
 * paragraph; credentials, years and counts stay the practitioner's placeholders until supplied;
 * Person JSON-LD carries only real values.
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
    { ...ABOUT_EXPERIENCE, children: <Paragraphs section={ABOUT_EXPERIENCE} /> },
    { ...ABOUT_LANGUAGES, children: <Paragraphs section={ABOUT_LANGUAGES} /> },
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
        figure={<Portrait name={name} planet={planet} />}
        actions={
          <>
            <Disc size="sm" href={ABOUT_HERO.primaryCta.href} label={ABOUT_HERO.primaryCta.label} />
            {/* The disc's halo and tick ring overflow its box, so the ghost link stands a little off it. */}
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

      <Toc items={TOC} />

      {/* Plate I — the credentials, as supplied, set as a ruled ledger. */}
      <FigureSection
        {...plate(ABOUT_TRAINING)}
        n="I"
        tone="muted"
        figureWidth="narrow"
        figure={<Credentials />}
        line={ABOUT_TRAINING.eyebrow}
      >
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
        <More summary="The steps in full">
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

      {/* Plate IV — her view of the practice. An honesty block: nothing here is folded. */}
      <FigureSection {...plate(ABOUT_LIMITS)} n="IV">
        <Visible section={ABOUT_LIMITS} />
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
        line={ABOUT_WHERE_LINKS.heading}
      >
        <Paragraphs section={ABOUT_WHERE} />
        <CountryDoors countries={countries} />
        <p className="text-sm text-muted-foreground">
          Hubs:{" "}
          <Link href="/astrology" className="text-accent-strong">
            Vedic astrology
          </Link>{" "}
          ·{" "}
          <Link href="/vastu" className="text-accent-strong">
            Vastu shastra
          </Link>{" "}
          ·{" "}
          <Link href="/services" className="text-accent-strong">
            Services
          </Link>
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
function Paragraphs({ section, closing = false }: { section: AboutSection; closing?: boolean }) {
  if (!section.paragraphs?.length && !(closing && section.closing)) return null;
  return (
    <More>
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
 * A section's paragraphs visible in full — the honesty blocks are never folded. Set as ruled
 * entries, each with the hero's star at its head, so the block reads as a ledger of plain
 * statements in the voice of the "not claimed" list rather than as an essay column.
 */
function Visible({ section }: { section: AboutSection }) {
  if (!section.paragraphs?.length) return null;
  return (
    <div className="divide-y divide-accent-border/40 border-y border-accent-border/40">
      {section.paragraphs.map((p) => (
        <p
          key={p.slice(0, 40)}
          className="flex gap-4 py-5 font-serif text-[1.05rem] leading-[1.55] text-muted-foreground"
        >
          <Ornament className="mt-1.5 size-4 shrink-0 text-accent-strong" />
          <span>{p}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * The portrait as the hero's figure. `SceneHero` draws its figure in a box of a fixed landscape
 * or square ratio and offers no portrait one, so the plate is fitted to the box's height with
 * container units (the image is 4:5; the glass, name, title and orb take ~10 rem beneath it),
 * capped at the 22 rem the plate is meant to be. A taller screen gives the full plate. On a
 * phone the box is at most 46svh and no width fits both the image and the caption, so the plate
 * keeps its proportions at 15.5 rem and is scaled as a whole (`zoom`, which lays out, unlike a
 * transform) to sit inside the box.
 */
function Portrait({ name, planet }: { name: string; planet: PlanetKey | undefined }) {
  return (
    <div className="[container-type:size] flex h-full w-full items-center justify-center">
      <PortraitPlate
        name={name}
        planet={planet}
        priority
        className="w-[min(22rem,calc((100cqh_-_10rem)/1.25))] max-w-[22rem] max-sm:w-[15.5rem] max-sm:[zoom:0.72]"
      />
    </div>
  );
}

/**
 * The credentials ledger, the figure of plate I: each row exactly as the practitioner has
 * supplied it, a placeholder shown as a placeholder with the note of what it is awaiting.
 */
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

/** The Earth's lit horizon, cropped to a 2:1 frame so the planet's dome curves through it. */
function Earth() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[2/1] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
    >
      <EarthHorizon className="top-[26%] bottom-auto -left-[10%] w-[120%] max-w-none md:top-[26%] md:bottom-auto md:-left-[10%] md:w-[120%]" />
    </div>
  );
}

/** A door for each country, twice: to her astrology page there and to her vastu page there. */
function CountryDoors({ countries }: { countries: Location[] }) {
  if (countries.length === 0) return null;
  const doors: Door[] = countries.flatMap((loc) => [
    {
      href: locationHref(loc, "astrologer"),
      label: loc.name,
      line: ABOUT_WHERE_LINKS.astrologerLabel,
      motif: "north-chart",
    },
    {
      href: locationHref(loc, "vastu-consultant"),
      label: loc.name,
      line: ABOUT_WHERE_LINKS.vastuLabel,
      motif: "compass",
    },
  ]);
  return (
    <DoorField doors={doors} variant="station" columns={2} className="border-b border-border/60" />
  );
}
