/**
 * Phase 5 management tables (P5-C): runtime feature flags, internal booking notes and the
 * admin-editable notification template overrides. All three are admin-only.
 */
import { boolean, index, pgTable, text, uniqueIndex, uuid, jsonb } from "drizzle-orm/pg-core";
import { adminAll } from "./_policies";
import { id, timestamps } from "./_shared";
import { adminUsers } from "./admin";
import { bookings } from "./booking";

// ---------------------------------------------------------------------------------------------
// feature_flags — `key` → JSON value, with the environment variable of the same name as the
// fallback when no row exists (`resolveFlag()` in src/lib/admin/settings.ts).
// ---------------------------------------------------------------------------------------------

export const FEATURE_FLAG_KEYS = [
  "PAYMENTS_ENABLED",
  "WHATSAPP_NOTIFICATIONS_ENABLED",
  "FEATURE_SOCIAL_WIDGETS",
] as const;
export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlagValue = boolean | string | number | null;

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: id(),
    key: text("key").notNull(),
    value: jsonb("value").$type<FeatureFlagValue>().notNull(),
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the app reads flags with the service role. */
    adminAll("feature_flags"),
    uniqueIndex("feature_flags_key_uidx").on(t.key),
  ],
);

// ---------------------------------------------------------------------------------------------
// booking_notes — internal notes an admin leaves on a booking. Never shown to the client, never
// emailed. Treated as personal data (they may mention the client's situation).
// ---------------------------------------------------------------------------------------------

export const bookingNotes = pgTable(
  "booking_notes",
  {
    id: id(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [
    adminAll("booking_notes"),
    index("booking_notes_booking_idx").on(t.bookingId, t.createdAt),
  ],
);

// ---------------------------------------------------------------------------------------------
// notification_templates — optional subject / intro overrides per (kind, recipient). The React
// Email templates stay the source of the message body; an override only replaces the subject
// and prepends an intro paragraph (`getTemplateOverride()` in src/lib/admin/settings.ts).
// ---------------------------------------------------------------------------------------------

export const TEMPLATE_RECIPIENTS = ["client", "practitioner"] as const;
export type TemplateRecipient = (typeof TEMPLATE_RECIPIENTS)[number];

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: id(),
    /** A `NotificationKind`: confirmation | reminder_24h | reminder_1h | reschedule | cancellation. */
    kind: text("kind").notNull(),
    recipient: text("recipient").$type<TemplateRecipient>().notNull().default("client"),
    /** Subject line; may use `{{clientFirstName}}`, `{{serviceName}}`, `{{date}}`, `{{brandName}}`, `{{bookingRef}}`. */
    subject: text("subject"),
    /** One paragraph inserted under the heading, same placeholders. */
    intro: text("intro"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    adminAll("notification_templates"),
    uniqueIndex("notification_templates_kind_recipient_uidx").on(t.kind, t.recipient),
  ],
);
