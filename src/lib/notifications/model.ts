/**
 * `BookingWithRelations` → a flat, serialisable `EmailModel` that every template renders from.
 * This is the one place that decides what a message may contain. Rules (CLAUDE.md §10, §12):
 * birth details never leave the ciphertext column; the practitioner copy carries the client's
 * question and contact details but says "birth details are in the admin"; every message shows
 * the appointment in both zones with the zone names spelled out.
 */
import { absoluteUrl, realValue, whatsappHref } from "@/lib/site";
import { describeInstant, firstName, formatDuration, formatMode } from "./format";
import type {
  BookingWithRelations,
  NotificationKind,
  NotificationRecipient,
  ZonedPair,
} from "./types";

/** One sentence, identical on every message (CLAUDE.md §8 E-E-A-T, §12). */
export const DISCLAIMER_LINE =
  "Astrology and vastu are traditional practices offered for guidance and reflection. They are not a substitute for medical, legal or financial advice, and no outcome is promised.";

export interface EmailModel {
  kind: NotificationKind;
  recipient: NotificationRecipient;
  brandName: string;
  practitionerName: string;
  /** Client's first name for greetings; full name for the practitioner copy. */
  clientFirstName: string;
  clientFullName: string;
  /** Present on the practitioner copy only. */
  clientEmail: string | null;
  clientPhone: string | null;
  serviceName: string;
  serviceLead: string;
  durationLabel: string;
  modeLabel: string;
  /** New/current appointment. */
  when: ZonedPair;
  /** Old appointment for a reschedule. */
  previous: ZonedPair | null;
  /** Absolute `/booking/[token]` link. */
  manageUrl: string;
  siteUrl: string;
  whatToPrepare: string[];
  /** The client's question — practitioner copy only, never on reminders. */
  question: string | null;
  cancellationReason: string | null;
  /** Real contact routes when the client has filled them in; null while placeholders. */
  contactEmail: string | null;
  whatsappUrl: string | null;
  bookingRef: string;
  disclaimer: string;
}

/** Short, non-guessable reference shown to people: first 8 of the id, upper-cased. */
export function bookingReference(bookingId: string): string {
  return bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function zonedPair(
  startsAt: Date,
  endsAt: Date,
  clientZone: string,
  practitionerZone: string,
): ZonedPair {
  return {
    client: describeInstant(startsAt, clientZone),
    clientEnd: describeInstant(endsAt, clientZone),
    practitioner: describeInstant(startsAt, practitionerZone),
    practitionerEnd: describeInstant(endsAt, practitionerZone),
    sameZone: clientZone === practitionerZone,
  };
}

export function buildEmailModel(
  kind: NotificationKind,
  recipient: NotificationRecipient,
  data: BookingWithRelations,
): EmailModel {
  const { booking, client, service, settings } = data;
  const forPractitioner = recipient === "practitioner";
  const clientZone = booking.clientTimezone || client.timezone;
  const practitionerZone = settings.timezone;
  const previous = data.previous
    ? zonedPair(data.previous.startsAt, data.previous.endsAt, clientZone, practitionerZone)
    : null;
  const question = forPractitioner && kind !== "reminder_24h" && kind !== "reminder_1h";
  const practitionerName = realValue(settings.practitionerName) ?? settings.brandName;

  return {
    kind,
    recipient,
    brandName: settings.brandName,
    practitionerName,
    clientFirstName: firstName(client.fullName),
    clientFullName: client.fullName,
    clientEmail: forPractitioner ? client.email : null,
    clientPhone: forPractitioner ? (client.phone ?? null) : null,
    serviceName: service.name,
    serviceLead: service.lead,
    durationLabel: formatDuration(service.durationMinutes),
    modeLabel: formatMode(booking.mode),
    when: zonedPair(booking.startsAt, booking.endsAt, clientZone, practitionerZone),
    previous,
    manageUrl: absoluteUrl(`/booking/${encodeURIComponent(booking.manageToken)}`),
    siteUrl: absoluteUrl("/"),
    whatToPrepare: [...service.whatToPrepare],
    question: question ? (realValue(booking.clientNotes) ?? null) : null,
    cancellationReason: realValue(data.cancellationReason) ?? null,
    contactEmail: realValue(settings.email) ?? null,
    whatsappUrl: whatsappHref(settings.whatsapp),
    bookingRef: bookingReference(booking.id),
    disclaimer: DISCLAIMER_LINE,
  };
}
