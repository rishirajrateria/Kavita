import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Image from "next/image";
import Link from "next/link";
import { Byline, CtaBand, FaqBlock, PageHero, QuestionSection, Toc } from "@/components/content";
import { Ornament } from "@/components/motifs";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
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
import { getPublishableLocations, getSameAsUrls, getSiteSettings, locationHref } from "@/lib/data";
import { personSchema } from "@/lib/seo/schema";
import { getSiteUrl, isPlaceholder, realValue } from "@/lib/site";

const BASE_METADATA: Metadata = {
  title: { absolute: ABOUT_META.title },
  description: ABOUT_META.description,
  alternates: { canonical: "/about", types: { "text/markdown": "/about.md" } },
  openGraph: {
    type: "profile",
    url: "/about",
    title: ABOUT_META.title,
    description: ABOUT_META.description,
    siteName: "Astrologer Kavita",
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/about");
}

const TOC = Object.entries(ABOUT_TOC_LABELS).map(([id, text]) => ({ id, text }));

/**
 * `/about` — the E-E-A-T anchor (CLAUDE.md §8, §9.9). Server component; every word is in the
 * HTML. The first paragraph is plain entity prose; credentials, years and counts are the
 * practitioner's placeholders until supplied; Person JSON-LD carries only real values.
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

  const person = personSchema({
    settings,
    sameAs,
    siteUrl,
    alumniOf: realAlumniOf(),
    awards: realAwards(),
    languages,
  });

  return (
    <>
      <JsonLd data={person} id="about-person" />

      <PageHero
        id="about"
        eyebrow={ABOUT_HERO.eyebrow}
        title={ABOUT_HERO.h1}
        lede={ABOUT_HERO.lede(name, settings.city, settings.country, settings.inPersonAvailable)}
        entity={ABOUT_HERO.entity}
        motif="lines"
        breadcrumbs={[{ name: "About", href: "/about" }]}
        actions={
          <>
            <Button asChild variant="gold" size="xl">
              <Link href={ABOUT_HERO.primaryCta.href}>{ABOUT_HERO.primaryCta.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href={ABOUT_HERO.secondaryCta.href}>
                {ABOUT_HERO.secondaryCta.label}
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            </Button>
          </>
        }
        aside={<Portrait name={name} />}
      />

      <Toc items={TOC} />

      <Container size="wide" className="pt-8">
        <Byline
          datePublished={ABOUT_DATES.published}
          dateModified={ABOUT_DATES.modified}
          withoutPhoto
        />
      </Container>

      {/* Training and lineage — credentials as a structured list from practitioner.ts */}
      <QuestionSection {...sectionProps(ABOUT_TRAINING)} tone="default">
        <Paragraphs section={ABOUT_TRAINING} />
        <div className="rounded-xl border border-t-2 border-t-accent-border bg-background shadow-sm">
          <Heading
            as="h3"
            level={6}
            className="border-b border-accent-border/40 px-5 py-4 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
          >
            {ABOUT_TRAINING_LABELS.listHeading}
          </Heading>
          <dl className="divide-y divide-accent-border/30">
            {PRACTITIONER.credentials.map((c) => (
              <div key={c.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <dt className="text-sm font-medium text-foreground">{c.label}</dt>
                <dd className="font-serif text-lg leading-snug">
                  {c.value}
                  {isPlaceholder(c.value) ? (
                    <span className="mt-1 block font-sans text-xs text-muted-foreground">
                      {ABOUT_TRAINING_LABELS.pending}: {c.usedFor}.
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <Closing section={ABOUT_TRAINING} />
      </QuestionSection>

      <QuestionSection {...sectionProps(ABOUT_EXPERIENCE)} tone="muted">
        <Paragraphs section={ABOUT_EXPERIENCE} />
      </QuestionSection>

      {/* Methodology, step by step, on deep indigo */}
      <QuestionSection {...sectionProps(ABOUT_METHOD)} tone="inverse">
        <ol className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          {ABOUT_METHOD.steps?.map((step, i) => (
            <li
              key={step.title}
              className="relative flex gap-5 rounded-2xl border border-accent-border/25 bg-card p-6 text-card-foreground sm:p-7"
            >
              <span
                aria-hidden="true"
                className="font-serif text-4xl leading-none text-accent-strong tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="space-y-2">
                <Heading as="h3" level={4} tone="accent">
                  {step.title}
                </Heading>
                <p className="leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </QuestionSection>

      <QuestionSection {...sectionProps(ABOUT_SESSION)} tone="default">
        <Paragraphs section={ABOUT_SESSION} />
      </QuestionSection>

      <QuestionSection {...sectionProps(ABOUT_LIMITS)} tone="muted">
        <Paragraphs section={ABOUT_LIMITS} />
      </QuestionSection>

      {/* Explicit "does not claim" list */}
      <QuestionSection {...sectionProps(ABOUT_NOT_CLAIMED)} tone="default">
        <ul className="max-w-[70ch] divide-y divide-accent-border/40 border-y border-accent-border/40">
          {ABOUT_NOT_CLAIMED.list?.map((item) => (
            <li key={item.slice(0, 32)} className="flex gap-4 py-4 text-lg leading-relaxed">
              <Ornament className="mt-2 size-4 shrink-0 text-accent-strong" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Closing section={ABOUT_NOT_CLAIMED} />
      </QuestionSection>

      <QuestionSection {...sectionProps(ABOUT_LANGUAGES)} tone="muted">
        <Paragraphs section={ABOUT_LANGUAGES} />
      </QuestionSection>

      <QuestionSection {...sectionProps(ABOUT_WHERE)} tone="default">
        <Paragraphs section={ABOUT_WHERE} />
        {countries.length > 0 ? (
          <div className="border-t border-accent-border/40 pt-8">
            <Heading as="h3" level={5} className="mb-5 text-accent-strong">
              {ABOUT_WHERE_LINKS.heading}
            </Heading>
            <ul className="flex flex-wrap gap-3">
              {countries.map((loc) => (
                <li
                  key={loc.path}
                  className="flex min-h-11 w-full items-stretch overflow-hidden rounded-full border border-accent-border/50 text-sm sm:w-auto"
                >
                  <span className="inline-flex flex-1 items-center pr-3 pl-5 font-serif text-base text-foreground sm:flex-none">
                    {loc.name}
                  </span>
                  <Link
                    href={locationHref(loc, "astrologer")}
                    className="inline-flex items-center border-l border-accent-border/50 px-3 text-accent-strong no-underline hover:bg-accent/60"
                  >
                    {ABOUT_WHERE_LINKS.astrologerLabel}
                    <span className="sr-only"> in {loc.name}</span>
                  </Link>
                  <Link
                    href={locationHref(loc, "vastu-consultant")}
                    className="inline-flex items-center border-l border-accent-border/50 px-3 text-accent-strong no-underline hover:bg-accent/60"
                  >
                    {ABOUT_WHERE_LINKS.vastuLabel}
                    <span className="sr-only"> in {loc.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
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
          </div>
        ) : null}
      </QuestionSection>

      <FaqBlock
        route="/about"
        id="faq"
        eyebrow={ABOUT_FAQ.eyebrow}
        heading={ABOUT_FAQ.heading}
        answer={ABOUT_FAQ.answer}
        items={[...ABOUT_FAQ.items]}
        tone="muted"
      />

      <CtaBand
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

function sectionProps(s: AboutSection) {
  return {
    id: s.id,
    route: "/about",
    eyebrow: s.eyebrow,
    question: s.question,
    answer: s.answer,
  };
}

function Paragraphs({ section }: { section: AboutSection }) {
  if (!section.paragraphs?.length) return null;
  return (
    <div className="max-w-[70ch] space-y-5 text-lg leading-relaxed">
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </div>
  );
}

function Closing({ section }: { section: AboutSection }) {
  if (!section.closing) return null;
  return (
    <p className="max-w-[70ch] border-t border-accent-border/40 pt-6 text-muted-foreground">
      {section.closing}
    </p>
  );
}

/** Arched portrait slot, as on the home hero — the labelled placeholder until the photo arrives. */
function Portrait({ name }: { name: string }) {
  return (
    <figure className="relative mx-auto w-full max-w-[17rem] sm:max-w-xs lg:max-w-[22rem]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(184_146_58_/_0.16),transparent_72%)] dark:bg-[radial-gradient(closest-side,rgb(203_168_79_/_0.12),transparent_72%)]"
      />
      <div className="arch arch-frame relative overflow-hidden border border-accent-border/60 bg-linear-to-b from-card to-muted shadow-lg">
        <Image
          src={PRACTITIONER.photo.src}
          width={PRACTITIONER.photo.width}
          height={PRACTITIONER.photo.height}
          alt={PRACTITIONER.photo.alt(name)}
          priority
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 17rem"
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="mt-4 text-center text-sm text-muted-foreground">
        <span className="font-serif text-base text-foreground">{name}</span>
        <span aria-hidden="true"> · </span>
        {PRACTITIONER.jobTitle}
      </figcaption>
    </figure>
  );
}
