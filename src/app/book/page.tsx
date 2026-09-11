import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { BookableService, BookingChannels } from "@/components/booking/types";
import { CtaBand, FaqBlock, PageHero, QuestionSection } from "@/components/content";
import { Callout } from "@/components/ui/callout";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { isPublishable } from "@/content/locations/schema";
import { BOOK_ERRORS, BOOK_FAQ, BOOK_HERO, BOOK_HOW, BOOK_META } from "@/content/pages/book";
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

/**
 * `/book` — the seven-step booking flow. The server renders the hero, the island's first step,
 * the how-it-works answer and the FAQ; the island fetches availability and posts the booking.
 * With JavaScript off, a `<noscript>` block offers the real channels from `site_settings`.
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
      <PageHero
        eyebrow={BOOK_HERO.eyebrow}
        title={service ? `Book ${service.name}` : BOOK_HERO.title}
        lede={BOOK_HERO.lede}
        motif="lines"
        breadcrumbs={[{ name: "Book", href: "/book" }]}
        className="pb-10 sm:pb-12 lg:pb-14"
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

      <QuestionSection
        route="/book"
        id={BOOK_HOW.id}
        eyebrow={BOOK_HOW.eyebrow}
        question={BOOK_HOW.question}
        answer={BOOK_HOW.answer}
      >
        <ol className="grid max-w-[60rem] gap-x-10 gap-y-5 sm:grid-cols-2">
          {BOOK_HOW.steps.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span
                aria-hidden="true"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-accent-border/60 font-serif text-sm text-accent-strong"
              >
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </QuestionSection>

      <FaqBlock
        route="/book"
        heading={BOOK_FAQ.heading}
        answer={BOOK_FAQ.answer}
        eyebrow={BOOK_FAQ.eyebrow}
        items={[...BOOK_FAQ.items]}
        tone="muted"
      />

      <CtaBand
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
