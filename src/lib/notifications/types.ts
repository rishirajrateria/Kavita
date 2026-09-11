/**
 * Notification contract shared with the booking engine (Phase 4 contract, P4-C). P4-A builds a
 * `BookingWithRelations` after every state change and hands it to `notify()`; nothing here reads
 * the database. Birth details travel only as ciphertext on `client.birthDetailsEncrypted` and are
 * never rendered by any template.
 */
import type { Booking, Client, Service, SiteSettings } from "@/db/schema";
import type { ZonedDescription } from "./format";

/** What `notify()` is asked to do. One kind may fan out to several `NotificationLogKind`s. */
export const NOTIFICATION_KINDS = [
  "confirmation",
  "reminder_24h",
  "reminder_1h",
  "reschedule",
  "cancellation",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Values of the `notification_log.kind` enum (owned by P4-A's migration). */
export const NOTIFICATION_LOG_KINDS = [
  "confirmation_client",
  "confirmation_practitioner",
  "reminder_24h",
  "reminder_1h",
  "reschedule",
  "cancellation",
] as const;
export type NotificationLogKind = (typeof NOTIFICATION_LOG_KINDS)[number];

/** Values of the `notification_log.channel` enum. */
export const NOTIFICATION_CHANNELS = ["email", "whatsapp"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** Who a message is addressed to. Practitioner copies never contain birth details. */
export type NotificationRecipient = "client" | "practitioner";

/**
 * A booking with everything a message needs. `settings` is the single `site_settings` row
 * (practitioner timezone, brand, contact); `service` supplies duration and `whatToPrepare`.
 * `previous` is the slot a rescheduled booking replaced, when the caller has it.
 */
export interface BookingWithRelations {
  booking: Booking;
  client: Client;
  service: Service;
  settings: SiteSettings;
  /** For `reschedule`: the old slot, so both emails can say what changed. */
  previous?: Pick<Booking, "startsAt" | "endsAt"> | null;
  /** For `cancellation`: the reason the client gave, if any. */
  cancellationReason?: string | null;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailSendResult {
  /** Provider message id, when the provider returns one. */
  providerRef: string | null;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export interface WhatsAppMessage {
  /** E.164 number. */
  to: string;
  text: string;
}

export interface WhatsAppProvider {
  readonly name: string;
  send(message: WhatsAppMessage): Promise<EmailSendResult>;
}

/** Outcome of one `notify()` call, for the cron route's counters and for tests. */
export interface NotifyOutcome {
  sent: number;
  skipped: number;
  failed: number;
}

/** One appointment described in the client's zone and the practitioner's zone. */
export interface ZonedPair {
  client: ZonedDescription;
  clientEnd: ZonedDescription;
  practitioner: ZonedDescription;
  practitionerEnd: ZonedDescription;
  /** True when both zones are the same IANA id; templates then show the time once. */
  sameZone: boolean;
}
