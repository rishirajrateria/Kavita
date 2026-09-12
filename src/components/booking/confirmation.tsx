import Link from "next/link";
import { CalendarPlusIcon } from "lucide-react";
import { Ornament, SouthIndianChart } from "@/components/motifs";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { BOOK_CONFIRMATION, BOOK_MODE_STEP } from "@/content/pages/book";
import { dualZoneParts, formatInZone } from "@/lib/booking/format";
import { calendarLinks } from "./calendar-links";
import type { BookableService, BookingMode, BookingReceipt } from "./types";

export interface ConfirmationProps {
  receipt: BookingReceipt;
  service: BookableService;
  mode: BookingMode;
  clientTz: string;
  practitionerTz: string;
  rescheduleNoticeHours: number;
  brandName: string;
}

/**
 * Step 7: the deep-indigo confirmation card — the time in both zones, three "add to calendar"
 * buttons (Google, Outlook, Apple/.ics), the manage link and what to have ready.
 */
export function Confirmation(props: ConfirmationProps) {
  const { receipt, service, mode, clientTz, practitionerTz } = props;
  const parts = dualZoneParts(receipt.startsAt, clientTz, practitionerTz);
  const links = calendarLinks({
    title: `${service.name} — ${props.brandName}`,
    startsAt: receipt.startsAt,
    endsAt: receipt.endsAt,
    description: `Your time: ${formatInZone(receipt.startsAt, clientTz, "datetime")} ${parts.clientZone}`,
    token: receipt.token,
  });

  /*
   * The receipt fills the glass panel it sits inside — the negative margins cancel that panel's
   * padding — with the deepest surface on the site, because this is the one screen that should
   * feel like a different room. Held at 90% rather than opaque so the pane's rim and the sky
   * still read at its edges; ivory on near-black stays far above AA either way.
   */
  return (
    <div
      data-tone="inverse"
      data-depth="deep"
      className="grain relative -m-6 overflow-hidden rounded-xl bg-background/90 p-6 text-foreground backdrop-blur-sm sm:-m-10 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[26rem] text-accent-strong/10 sm:w-[32rem]"
      >
        <SouthIndianChart decorative strokeWidth={0.6} />
      </div>
      <div className="relative space-y-8">
        <header>
          <p className="mb-3 flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase before:h-px before:w-8 before:shrink-0 before:bg-accent-border">
            {BOOK_CONFIRMATION.eyebrow}
          </p>
          <Heading
            as="h2"
            level={2}
            className="text-3xl sm:text-4xl"
            id="booking-confirmed"
            tabIndex={-1}
          >
            {BOOK_CONFIRMATION.title}
          </Heading>
          <p className="mt-4 max-w-[40rem] text-base leading-relaxed text-muted-foreground">
            {BOOK_CONFIRMATION.body(service.name)}
          </p>
        </header>

        <dl className="grid gap-px overflow-hidden rounded-lg border border-accent-border/40 bg-accent-border/30 sm:grid-cols-3">
          <div className="bg-surface-muted px-5 py-4">
            <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
              In your time zone
            </dt>
            <dd className="mt-1.5 font-serif text-lg leading-snug">
              {formatInZone(receipt.startsAt, clientTz, "long-date")}
              <br />
              {parts.clientTime} {parts.clientZone}
            </dd>
          </div>
          <div className="bg-surface-muted px-5 py-4">
            <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
              In Astrologer Kavita&rsquo;s
            </dt>
            <dd className="mt-1.5 font-serif text-lg leading-snug">
              {formatInZone(receipt.startsAt, practitionerTz, "long-date")}
              <br />
              {formatInZone(receipt.startsAt, practitionerTz)} {parts.practitionerZone}
            </dd>
          </div>
          <div className="bg-surface-muted px-5 py-4">
            <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
              Format
            </dt>
            <dd className="mt-1.5 font-serif text-lg leading-snug">
              {BOOK_MODE_STEP.modes[mode].label}
            </dd>
          </div>
        </dl>

        <div>
          <p className="mb-3 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase">
            {BOOK_CONFIRMATION.addToCalendar}
          </p>
          <div className="flex flex-wrap gap-3">
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
              <a href={links.ics} download>
                <CalendarPlusIcon aria-hidden="true" />
                {BOOK_CONFIRMATION.apple}
              </a>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button asChild variant="gold" size="xl">
            <Link href={`/booking/${encodeURIComponent(receipt.token)}`}>
              {BOOK_CONFIRMATION.manage}
            </Link>
          </Button>
          <p className="max-w-[28rem] text-sm leading-relaxed text-muted-foreground">
            {BOOK_CONFIRMATION.manageHint(props.rescheduleNoticeHours)}
          </p>
        </div>

        {service.whatToPrepare.length > 0 ? (
          <div className="border-t border-accent-border/40 pt-6">
            <p className="mb-3 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase">
              {BOOK_CONFIRMATION.prepareHeading}
            </p>
            <ul className="space-y-2 text-sm leading-relaxed">
              {service.whatToPrepare.map((item) => (
                <li key={item} className="flex gap-3">
                  <Ornament className="mt-1.5 size-3 shrink-0 text-accent-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">
          {BOOK_CONFIRMATION.paymentNote}{" "}
          <Link href="/book" className="text-accent-strong">
            {BOOK_CONFIRMATION.bookAnother}
          </Link>
        </p>
      </div>
    </div>
  );
}
