import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Ornament } from "@/components/motifs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { isPublishable } from "@/content/locations/schema";
import {
  getLocationByPath,
  getServiceBySlug,
  getServices,
  getSiteSettings,
  locationHref,
} from "@/lib/data";
import { mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";

const LEAD_LABEL = {
  astrology: "Astrology-led",
  vastu: "Vastu-led",
  integrated: "Integrated",
} as const;

export const metadata: Metadata = {
  title: "Book a consultation",
  description:
    "Book a consultation with Astrologer Kavita: choose a service, tell her where you are, and arrange a time by WhatsApp, email or phone while online booking is being built.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/book" },
};

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/**
 * Interim booking page (Phase 2). Honest and minimal: it shows the service and place the
 * visitor chose, explains that online booking with live availability arrives in Phase 4, and
 * offers the real contact channels from `site_settings`. Server-rendered, `noindex`, no client JS.
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

  const wa = whatsappHref(settings.whatsapp);
  const mail = mailtoHref(settings.email);
  const tel = telHref(settings.phone);
  const hasChannel = Boolean(wa || mail || tel);
  const place = location && isPublishable(location) ? location : null;

  return (
    <>
      <Section as="header" spacing="none" className="overflow-hidden pt-4 pb-12 sm:pb-16">
        <Container size="default" className="relative">
          <Breadcrumbs items={[{ name: "Book", href: "/book" }]} className="mb-8" />
          <Heading as="h1" level={1} eyebrow="Book a consultation">
            {service
              ? `Book ${service.name}${place ? ` from ${place.name}` : ""}`
              : "Book a consultation with Astrologer Kavita"}
          </Heading>
          <p className="answer mt-6">
            Booking with Astrologer Kavita is arranged directly for now: choose the service, say
            where you are, and send a message by WhatsApp, email or phone with your preferred days.
            You receive a confirmed time in your local hours, and what to prepare before the
            session.
          </p>
        </Container>
      </Section>

      <Section spacing="lg" tone="muted" bordered>
        <Container size="default" className="space-y-10">
          <Callout variant="info" title="Online booking with live availability is coming">
            Choosing a slot on a calendar and paying online arrives in the next phase of this site.
            Until then Astrologer Kavita confirms every booking personally, usually within{" "}
            {settings.responseTimeHours} hours.
          </Callout>

          {service ? (
            <article className="rounded-2xl border border-accent-border/40 bg-background p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <Badge variant="caps">{LEAD_LABEL[service.lead]}</Badge>
                <span className="text-sm text-muted-foreground">{service.durationMinutes} min</span>
              </div>
              <Heading as="h2" level={3} className="mt-4">
                {service.name}
              </Heading>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {service.shortDescription}
              </p>
              {place ? (
                <p className="mt-4 border-t border-accent-border/30 pt-4 text-sm text-muted-foreground">
                  For a client in{" "}
                  <Link href={locationHref(place, "astrologer")} className="text-accent-strong">
                    {place.name}
                  </Link>{" "}
                  ({place.timezone}). Sessions are scheduled in {place.name}&rsquo;s own hours.
                </p>
              ) : null}
              {service.whatToPrepare.length > 0 ? (
                <>
                  <Heading
                    as="h3"
                    level={6}
                    className="mt-6 font-sans text-xs tracking-[0.14em] text-accent-strong uppercase"
                  >
                    What to have ready
                  </Heading>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                    {service.whatToPrepare.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Ornament className="mt-1.5 size-3 shrink-0 text-accent-strong" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="mt-6 text-sm">
                <Link href="/book" className="text-accent-strong">
                  Choose a different service
                </Link>
              </p>
            </article>
          ) : (
            <div>
              <Heading as="h2" level={3}>
                Which consultation?
              </Heading>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/book?service=${s.slug}${locationPath ? `&location=${encodeURIComponent(locationPath)}` : ""}`}
                      className="flex min-h-14 items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3 no-underline hover:border-accent-border"
                    >
                      <span className="font-serif text-lg">{s.name}</span>
                      <span className="text-sm text-muted-foreground">{s.durationMinutes} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Heading as="h2" level={3}>
              Send your request
            </Heading>
            {hasChannel ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {wa ? (
                  <Button asChild variant="gold" size="xl">
                    <a href={wa} rel="noopener">
                      WhatsApp
                    </a>
                  </Button>
                ) : null}
                {mail ? (
                  <Button asChild variant="gold-outline" size="xl">
                    <a href={mail}>Email {realValue(settings.email)}</a>
                  </Button>
                ) : null}
                {tel ? (
                  <Button asChild variant="ghost" size="xl">
                    <a href={tel}>Call {realValue(settings.phone)}</a>
                  </Button>
                ) : null}
              </div>
            ) : (
              <Callout variant="warn" className="mt-5" title="Contact details are being confirmed">
                The practice&rsquo;s WhatsApp number, email address and phone number have not yet
                been published on this site. Please use the{" "}
                <Link href="/contact">contact page</Link> in the meantime.
              </Callout>
            )}
            <p className="mt-5 max-w-prose text-sm leading-relaxed text-muted-foreground">
              Include the service, where you are, two or three days that suit you, and — for a chart
              reading — your date, time and place of birth. Birth details are personal data: they
              are used only for your reading and never published.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
