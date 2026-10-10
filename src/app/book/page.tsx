import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { BookableService, BookingChannels } from "@/components/booking/types";
import { CtaDisc, FigureSection, Foot, SceneHero, StepLine } from "@/components/content";
import { HoursFigure } from "@/components/forms/nap-block";
import { DashaTimeline, Disc, dashaSegmentFractions } from "@/components/motifs";
import { Callout } from "@/components/ui/callout";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { isPublishable } from "@/content/locations/schema";
import {
  BOOK_ERRORS,
  BOOK_FAQ,
  BOOK_HERO,
  BOOK_HOW,
  BOOK_META,
  BOOK_STEPS,
} from "@/content/pages/book";
import { dateKeyInZone, monthKeyOf } from "@/lib/booking/format";
import { getLocationByPath, getServiceBySlug, getServices, getSiteSettings } from "@/lib/data";
import { mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";

const BASE_METADATA: Metadata = {
  title: { absolute: BOOK_META.title },
  description: BOOK_META.description,
  /** Transactional page with query variants: reachable, followed, never indexed. */
  robots: { index: false, follow: true },
  alternates: { canonical: "/book" },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/book");
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

/**
 * The seven steps as a plate: the rail's short labels on the ruled line (the picture, from
 * 640 px), and the seven sentences of `BOOK_HOW.steps` as a ruled list beneath it — every
 * sentence visible, nothing folded. Below 640 px the shared step line drops its rule and turns
 * its labels into a list that would repeat the sentences directly beneath, so the phone keeps
 * a figure of its own: the same dasha rule divided seven ways with the numerals I–VII under
 * their segments, and no words.
 */
function StepsFigure() {
  const fractions = dashaSegmentFractions(BOOK_STEPS.map(() => 1));
  return (
    <>
      <StepLine
        className="w-full max-sm:hidden"
        steps={BOOK_STEPS.map((s) => ({ title: s.short }))}
        moreSummary="The steps in full"
      />
      <div className="w-full sm:hidden" aria-hidden="true">
        <DashaTimeline
          segments={BOOK_STEPS.map(() => 1)}
          decorative
          className="text-accent-strong"
        />
        <div className="mt-1 flex">
          {BOOK_STEPS.map((s, i) => (
            <span
              key={s.short}
              className="text-center font-serif text-lg leading-none text-accent-strong"
              style={{
                flex: `0 0 ${((fractions[i]?.end ?? 0) - (fractions[i]?.start ?? 0)) * 100}%`,
              }}
            >
              {ROMAN[i] ?? String(i + 1)}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/** The sentences; numbered on phones only, where the rail's labels are not above them. */
function StepSentences() {
  return (
    <ol className="border-t border-border/60">
      {BOOK_HOW.steps.map((step, i) => (
        <li
          key={step}
          className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3 border-b border-border/60 py-3 sm:grid-cols-1"
        >
          <span
            aria-hidden="true"
            className="font-serif text-lg leading-none text-accent-strong sm:hidden"
          >
            {ROMAN[i] ?? String(i + 1)}
          </span>
          <span className="font-serif text-[1.1rem] leading-snug text-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * `/book` — the seven-step booking flow, in the language of the home hero (SPEC §3): the
 * practitioner's hours on a 24-hour ring (and the visitor's local ring when `?location=`
 * resolves), the parchment disc to begin, the island itself, the steps on a ruled line, the
 * notes, the disc. The server renders the hero, the island's first step, the how-it-works
 * answer and the FAQ; the island fetches availability and posts the booking. With JavaScript
 * off, a `<noscript>` block offers the real channels from `site_settings`.
 */
export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const sp = await searchParams;
  const serviceSlug = one(sp.service);
  const locationPath = one(sp.location);

  const [settings, services, service, location] = await Promise.all([
    getSiteSettings(),
    getServices(),
    serviceSlug ? getServiceBySlug(serviceSlug) : Promise.resolve(null),
    locationPath ? getLocationByPath(locationPath) : Promise.resolve(null),
  ]);

  const place = location && isPublishable(location) ? location : null;
  const channels: BookingChannels = {
    whatsapp: whatsappHref(settings.whatsapp),
    email: mailtoHref(settings.email),
    tel: telHref(settings.phone),
    emailText: realValue(settings.email),
    phoneText: realValue(settings.phone),
  };
  const practiceCity = realValue(settings.city);
  const matchesCity =
    !place || (practiceCity !== undefined && slugify(place.name) === slugify(practiceCity));
  const inPersonOffered = settings.inPersonAvailable && matchesCity;

  const now = new Date();
  const clientTz = place?.timezone ?? settings.timezone;
  const initialMonth = monthKeyOf(dateKeyInZone(now, clientTz));
  const horizonEnd = new Date(now.getTime() + settings.horizonDays * 86_400_000);
  const maxMonth = monthKeyOf(dateKeyInZone(horizonEnd, clientTz));

  const bookable: BookableService[] = services.map((s) => ({
    slug: s.slug,
    name: s.name,
    lead: s.lead,
    durationMinutes: s.durationMinutes,
    bufferAfterMinutes: s.bufferAfterMinutes,
    shortDescription: s.shortDescription,
    whatToPrepare: s.whatToPrepare,
    deliveryModes: s.deliveryModes,
    priceNote: s.priceNote,
    priceMinor: s.priceMinor,
    currency: s.currency,
  }));

  return (
    <>
      <SceneHero
        id="book-hero"
        title={service ? `Book ${service.name}` : BOOK_HERO.title}
        tagline={BOOK_HERO.eyebrow}
        lede={BOOK_HERO.lede}
        figure={
          <HoursFigure
            settings={settings}
            local={place ? { name: place.name, timezone: place.timezone } : undefined}
            now={now}
          />
        }
        figureSize={place ? "wide" : "small"}
        figureRatio={place ? "2/1" : "1/1"}
        breadcrumbs={[{ name: "Book", href: "/book" }]}
        actions={<Disc size="sm" href="#booking" label="Begin" title={BOOK_HERO.eyebrow} />}
      />

      <Section id="booking" spacing="md" tone="muted" bordered className="scroll-mt-20">
        <Container size="wide" className="space-y-6">
          <noscript>
            <Callout variant="warn" title={BOOK_ERRORS.noScript.title}>
              <p>{BOOK_ERRORS.noScript.body}</p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                {channels.whatsapp ? (
                  <li>
                    <a
                      href={channels.whatsapp}
                      rel="noopener"
                      className="font-medium text-accent-strong"
                    >
                      WhatsApp
                    </a>
                  </li>
                ) : null}
                {channels.email ? (
                  <li>
                    <a href={channels.email} className="font-medium text-accent-strong">
                      {channels.emailText}
                    </a>
                  </li>
                ) : null}
                <li>
                  <Link href="/contact" className="font-medium text-accent-strong">
                    Contact page
                  </Link>
                </li>
              </ul>
            </Callout>
          </noscript>
          <BookingFlow
            services={bookable}
            initialServiceSlug={service?.slug}
            location={
              place ? { path: place.path, name: place.name, timezone: place.timezone } : null
            }
            practitionerTz={settings.timezone}
            practitionerCity={practiceCity ?? "the practice city"}
            inPersonOffered={inPersonOffered}
            channels={channels}
            rescheduleNoticeHours={settings.rescheduleNoticeHours}
            initialMonth={initialMonth}
            maxMonth={maxMonth}
            now={now.toISOString()}
            brandName={settings.brandName}
          />
        </Container>
      </Section>

      <FigureSection
        route="/book"
        id={BOOK_HOW.id}
        n="I"
        question={BOOK_HOW.question}
        answer={BOOK_HOW.answer}
        line={BOOK_HOW.eyebrow}
        figureWidth="default"
        figure={<StepsFigure />}
      >
        <StepSentences />
      </FigureSection>

      <Foot
        route="/book"
        eyebrow={BOOK_FAQ.eyebrow}
        heading={BOOK_FAQ.heading}
        answer={BOOK_FAQ.answer}
        faqs={[...BOOK_FAQ.items]}
      />

      <CtaDisc
        eyebrow="Prefer to ask first?"
        title="Not sure which consultation fits?"
        body="Send a short message describing what is going on and Astrologer Kavita will say which session suits, and whether astrology, vastu or both are the right instrument for it."
        primaryHref="/contact"
        primaryLabel="Ask a question"
        secondaryHref={channels.whatsapp ?? "/services"}
        secondaryLabel={channels.whatsapp ? "WhatsApp" : "Compare the services"}
        motif="compass"
      />
    </>
  );
}
