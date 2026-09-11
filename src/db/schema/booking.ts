/**
 * Availability, clients, bookings and the payment seam (CLAUDE.md §10, §11).
 *
 * Personal data rules: birth details are stored ONLY as `birth_details_encrypted` (bytea, encrypted
 * by the application with the key named in `birth_details_key_id`). Nothing in this file is ever
 * readable by `anon`; route handlers use the service role and a security-definer RPC arrives in
 * Phase 4.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminAll } from "./_policies";
import { bytea, currencyEnum, id, timestamps } from "./_shared";
import { adminUsers } from "./admin";
import { locations } from "./locations";
import { services } from "./services";

// ---------------------------------------------------------------------------------------------
// availability
// ---------------------------------------------------------------------------------------------

export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: id(),
    /** 0 = Sunday … 6 = Saturday (JS convention). */
    weekday: smallint("weekday").notNull(),
    /** `HH:MM` in the practitioner's timezone (`site_settings.timezone`). */
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    /** Null = applies to every service. */
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the slot generator (Phase 4) reads with the service role and exposes only
     *  computed free slots to visitors. */
    adminAll("availability_rules"),
    index("availability_rules_weekday_idx").on(t.weekday, t.isActive),
  ],
);

export const availabilityExceptions = pgTable(
  "availability_exceptions",
  {
    id: id(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
    /** `true` blocks the range (holiday); `false` opens extra hours outside the rules. */
    isBlocked: boolean("is_blocked").notNull().default(true),
    reason: text("reason"),
    ...timestamps,
  },
  (t) => [
    adminAll("availability_exceptions"),
    index("availability_exceptions_range_idx").on(t.startsAt, t.endsAt),
  ],
);

// ---------------------------------------------------------------------------------------------
// clients — sensitive personal data
// ---------------------------------------------------------------------------------------------

export const clients = pgTable(
  "clients",
  {
    id: id(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    /** IANA timezone the client books and receives reminders in. */
    timezone: text("timezone").notNull(),
    preferredLanguage: text("preferred_language"),
    /** AES-GCM ciphertext of `{ date, time, place, timeAccuracy }`. Never plaintext, never logged. */
    birthDetailsEncrypted: bytea("birth_details_encrypted"),
    /** Identifier of the key version used, for rotation. */
    birthDetailsKeyId: text("birth_details_key_id"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    /** Admin-only. `anon` has no access of any kind; bookings are created server-side. */
    adminAll("clients"),
    uniqueIndex("clients_email_uidx").on(t.email),
  ],
);

// ---------------------------------------------------------------------------------------------
// bookings
// ---------------------------------------------------------------------------------------------

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "awaiting_payment",
  "paid",
  "payment_pending_offline",
  "rescheduled",
  "cancelled",
  "completed",
  "no_show",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const bookingStatusEnum = pgEnum("booking_status", BOOKING_STATUSES);

/** Statuses that hold a calendar slot; the partial unique index below is scoped to these. */
export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "awaiting_payment",
  "paid",
  "payment_pending_offline",
] as const satisfies readonly BookingStatus[];

export const BOOKING_MODES = ["online_video", "online_phone", "in_person"] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];
export const bookingModeEnum = pgEnum("booking_mode", BOOKING_MODES);

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    /** Where the client is, for the regional view in admin; optional. */
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
    /** Client's IANA timezone at booking time, for the both-timezone display. */
    clientTimezone: text("client_timezone").notNull(),
    mode: bookingModeEnum("mode").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    /** What the client wants to discuss; free text, treated as personal data. */
    clientNotes: text("client_notes"),
    /** Random token in the self-service reschedule/cancel link (`/booking/[token]`). */
    manageToken: text("manage_token").notNull(),
    /** The booking this one replaced, when rescheduled. */
    rescheduledFromId: uuid("rescheduled_from_id"),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; visitors reach their own booking only via the token in a route handler. */
    adminAll("bookings"),
    /** No two active bookings may hold the same start time. */
    uniqueIndex("bookings_active_slot_uidx")
      .on(t.startsAt)
      .where(
        sql`status in ('pending', 'confirmed', 'awaiting_payment', 'paid', 'payment_pending_offline')`,
      ),
    uniqueIndex("bookings_manage_token_uidx").on(t.manageToken),
    index("bookings_client_idx").on(t.clientId),
    index("bookings_status_starts_idx").on(t.status, t.startsAt),
  ],
);

export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: id(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status").notNull(),
    /** `admin` | `client` | `system` */
    changedBy: text("changed_by").notNull(),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    reason: text("reason"),
    ...timestamps,
  },
  (t) => [
    adminAll("booking_status_history"),
    index("booking_status_history_booking_idx").on(t.bookingId),
  ],
);

// ---------------------------------------------------------------------------------------------
// payments — provider-agnostic seam (§11). Unused in v1 beyond the Noop provider.
// ---------------------------------------------------------------------------------------------

export const PAYMENT_STATUSES = [
  "created",
  "pending",
  "authorized",
  "captured",
  "refunded",
  "failed",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    /** `noop` | `razorpay` | `stripe` — the `PaymentProvider` registry key. */
    provider: text("provider").notNull(),
    providerRef: text("provider_ref"),
    amountMinor: integer("amount_minor").notNull(),
    currency: currencyEnum("currency").notNull(),
    status: paymentStatusEnum("status").notNull().default("created"),
    idempotencyKey: text("idempotency_key").notNull(),
    /** Last raw gateway payload, for reconciliation. */
    providerPayload: jsonb("provider_payload").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    adminAll("payments"),
    uniqueIndex("payments_idempotency_key_uidx").on(t.idempotencyKey),
    index("payments_booking_idx").on(t.bookingId),
    index("payments_provider_ref_idx").on(t.provider, t.providerRef),
  ],
);

// ---------------------------------------------------------------------------------------------
// notification_log — one row per (booking, kind, channel) send attempt; `dedupe_key` makes
// `notify()` idempotent so a retried cron never emails twice.
// ---------------------------------------------------------------------------------------------

export const NOTIFICATION_KINDS = [
  "confirmation_client",
  "confirmation_practitioner",
  "reminder_24h",
  "reminder_1h",
  "reschedule",
  "cancellation",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export const notificationKindEnum = pgEnum("notification_kind", NOTIFICATION_KINDS);

export const NOTIFICATION_CHANNELS = ["email", "whatsapp"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export const notificationChannelEnum = pgEnum("notification_channel", NOTIFICATION_CHANNELS);

export const notificationLog = pgTable(
  "notification_log",
  {
    id: id(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    kind: notificationKindEnum("kind").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    /** `${bookingId}:${kind}:${channel}` — the idempotency key. */
    dedupeKey: text("dedupe_key").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    /** Provider message id (Resend id, WhatsApp message id). Never the message body. */
    providerRef: text("provider_ref"),
    /** Error class/summary only — never recipient addresses or content. */
    error: text("error"),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the notification layer writes with the service role. */
    adminAll("notification_log"),
    uniqueIndex("notification_log_dedupe_key_uidx").on(t.dedupeKey),
    index("notification_log_booking_idx").on(t.bookingId, t.kind),
  ],
);

// ---------------------------------------------------------------------------------------------
// floor_plans — private Supabase Storage objects (bucket `floor-plans`) uploaded during booking.
// `booking_id` is null between upload and booking creation and is linked by `createBooking`.
// ---------------------------------------------------------------------------------------------

export const floorPlans = pgTable(
  "floor_plans",
  {
    id: id(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    /** Object path inside the private `floor-plans` bucket; served only via signed URLs in admin. */
    storagePath: text("storage_path").notNull(),
    contentType: text("content_type").notNull(),
    bytes: integer("bytes").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (t) => [
    /** Personal data (a client's home layout): admin-only. */
    adminAll("floor_plans"),
    uniqueIndex("floor_plans_storage_path_uidx").on(t.storagePath),
    index("floor_plans_booking_idx").on(t.bookingId),
  ],
);
