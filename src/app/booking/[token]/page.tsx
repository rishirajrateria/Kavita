import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlusIcon } from "lucide-react";
import { ManageBooking } from "@/components/booking/manage-booking";
import { KeyFacts, SceneHero } from "@/components/content";
import { Disc } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { BOOK_CONFIRMATION, BOOK_MODE_STEP, MANAGE_PAGE } from "@/content/pages/book";
import {
  dateKeyInZone,
  dualZoneParts,
  durationLabel,
  formatInZone,
  monthKeyOf,
} from "@/lib/booking/format";
import { calendarLinks } from "@/lib/booking/ics";
import { getBookingByToken } from "@/lib/booking/manage";
import { mailtoHref, realValue, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** The parchment disc as the page's figure: the one object every page shares. */
function DiscFigure({ href, title }: { href: string; title?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Disc size="md" href={href} label={MANAGE_PAGE.eyebrow} title={title} />
    </div>
  );
}

/**
 * `/booking/[token]` — the private self-service page from the confirmation email. The token is
 * verified server-side; the page opens in the home hero's language (the parchment disc as the
 * figure, the status on the ruled tagline, the session in both zones as the lede), shows the
 * session on the key-facts plate and hands reschedule/cancel to a small island. Never indexed,
 * never cached.
 */
export default async function BookingManagePage({
  params,
  searchParams,
}: PageProps<"/booking/[token]">) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const result = await getBookingByToken(token);
  const crumbs = [{ name: "Your booking", href: `/booking/${encodeURIComponent(token)}` }];

  if (!result.ok) {
    const notConnected = result.reason === "not_connected";
    const copy = notConnected ? MANAGE_PAGE.notConnected : MANAGE_PAGE.invalid;
    return (
      <SceneHero
        id="booking-hero"
        title={copy.title}
        tagline={MANAGE_PAGE.eyebrow}
        lede={copy.body}
        figure={<DiscFigure href="/book" />}
        figureSize="small"
        figureRatio="1/1"
        breadcrumbs={crumbs}
        actions={
          <>
            <Button asChild variant="gold" size="xl">
              <Link href="/contact">Contact Astrologer Kavita</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href="/book">{MANAGE_PAGE.bookAgain}</Link>
            </Button>
          </>
        }
      />
    );
  }

  const { booking, service, settings } = result.relations;
  const clientTz = booking.clientTimezone;
  const practitionerTz = settings.timezone;
  const startsAt = booking.startsAt.toISOString();
  const parts = dualZoneParts(startsAt, clientTz, practitionerTz);
  const links = calendarLinks(booking, service, settings);
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + settings.horizonDays * 86_400_000);
  const closedNote =
    booking.status === "cancelled"
      ? MANAGE_PAGE.closed.cancelled
      : booking.status === "rescheduled"
        ? MANAGE_PAGE.closed.rescheduled
        : booking.status === "completed"
          ? MANAGE_PAGE.closed.completed
          : null;
  const contactLine = [
    realValue(settings.whatsapp) ? whatsappHref(settings.whatsapp) : null,
    mailtoHref(settings.email),
  ];

  return (
    <>
      <SceneHero
        id="booking-hero"
        title={MANAGE_PAGE.title(service.name)}
        tagline={`${MANAGE_PAGE.eyebrow} · ${MANAGE_PAGE.status[booking.status]}`}
        lede={`${formatInZone(startsAt, clientTz, "long-date")} at ${parts.clientTime} ${parts.clientZone}${
          parts.practitionerTime
            ? ` — ${parts.practitionerTime} ${parts.practitionerZone} for Astrologer Kavita`
            : ""
        }. ${BOOK_MODE_STEP.modes[booking.mode].label}, ${durationLabel(service.durationMinutes)}.`}
        figure={
          <DiscFigure
            href={closedNote ? "/book" : "#manage"}
            title={closedNote ? MANAGE_PAGE.bookAgain : BOOK_CONFIRMATION.manage}
          />
        }
        figureSize="small"
        figureRatio="1/1"
        breadcrumbs={crumbs}
        actions={
          result.isActive ? (
            <>
              <Button asChild variant="gold-outline" size="lg">
                <a href={links.google} target="_blank" rel="noopener noreferrer">
                  <CalendarPlusIcon aria-hidden="true" />
                  {BOOK_CONFIRMATION.google}
                </a>
              </Button>
              <Button asChild variant="gold-outline" size="lg">
                <a href={links.outlook} target="_blank" rel="noopener noreferrer">
                  <CalendarPlusIcon aria-hidden="true" />
                  {BOOK_CONFIRMATION.outlook}
                </a>
              </Button>
              <Button asChild variant="gold-outline" size="lg">
                <a href={links.apple} download>
                  <CalendarPlusIcon aria-hidden="true" />
                  {BOOK_CONFIRMATION.apple}
                </a>
              </Button>
            </>
          ) : undefined
        }
      />

      <KeyFacts
        heading="Your session"
        items={[
          {
            label: MANAGE_PAGE.labels.yourZone,
            value: `${formatInZone(startsAt, clientTz, "datetime")} ${parts.clientZone}`,
          },
          {
            label: MANAGE_PAGE.labels.herZone,
            value: `${formatInZone(startsAt, practitionerTz, "datetime")} ${parts.practitionerZone}`,
          },
          { label: MANAGE_PAGE.labels.format, value: BOOK_MODE_STEP.modes[booking.mode].label },
          { label: MANAGE_PAGE.labels.duration, value: durationLabel(service.durationMinutes) },
        ]}
      />

      <Section id="manage" spacing="lg" className="scroll-mt-20">
        <Container size="default" className="space-y-8">
          {one(sp.moved) === "1" ? (
            <Callout variant="success" role="status">
              {MANAGE_PAGE.reschedule.moved}
            </Callout>
          ) : null}
          {closedNote ? (
            <Callout variant="info">
              {closedNote}{" "}
              <Link href="/book" className="text-accent-strong">
                {MANAGE_PAGE.bookAgain}
              </Link>
            </Callout>
          ) : (
            <ManageBooking
              token={token}
              serviceSlug={service.slug}
              clientTz={clientTz}
              practitionerTz={practitionerTz}
              canReschedule={result.canReschedule}
              canCancel={result.canCancel}
              noticeHours={result.noticeHours}
              initialMonth={monthKeyOf(dateKeyInZone(now, clientTz))}
              maxMonth={monthKeyOf(dateKeyInZone(horizonEnd, clientTz))}
              now={now.toISOString()}
            />
          )}
          {service.whatToPrepare.length > 0 && result.isActive ? (
            <div className="border-t border-accent-border/30 pt-8">
              <p className="plate-n mb-4">{BOOK_CONFIRMATION.prepareHeading}</p>
              <ul className="divide-y divide-border/60 border-y border-border/60">
                {service.whatToPrepare.map((item) => (
                  <li key={item} className="py-3 font-serif text-[1.1rem] leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="font-sans text-[0.8rem] leading-relaxed text-muted-foreground">
            {BOOK_CONFIRMATION.paymentNote}
            {contactLine.some(Boolean) ? (
              <>
                {" "}
                Questions:{" "}
                {contactLine[0] ? (
                  <a href={contactLine[0]} rel="noopener" className="text-accent-strong">
                    WhatsApp
                  </a>
                ) : null}
                {contactLine[0] && contactLine[1] ? " · " : null}
                {contactLine[1] ? (
                  <a href={contactLine[1]} className="text-accent-strong">
                    email
                  </a>
                ) : null}
                .
              </>
            ) : null}
          </p>
        </Container>
      </Section>
    </>
  );
}
