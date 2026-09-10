/**
 * First-party, cookieless analytics (CLAUDE.md §13E; Phase 5 builds the tracker and rollup).
 * Nothing here identifies a person: `visitor_hash` is a daily-rotating salted hash.
 */
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminAll } from "./_policies";
import { id, timestamps } from "./_shared";

export const analyticsSessions = pgTable(
  "analytics_sessions",
  {
    id: id(),
    visitorHash: text("visitor_hash").notNull(),
    firstPath: text("first_path").notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    /** ISO 3166-1 alpha-2 from the edge geo header. */
    region: text("region"),
    /** desktop | mobile | tablet | bot */
    deviceType: text("device_type"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the tracker endpoint writes with the service role. */
    adminAll("analytics_sessions"),
    index("analytics_sessions_visitor_idx").on(t.visitorHash, t.startedAt),
    index("analytics_sessions_started_idx").on(t.startedAt),
  ],
);

export const analyticsPageviews = pgTable(
  "analytics_pageviews",
  {
    id: id(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => analyticsSessions.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    referrer: text("referrer"),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    durationMs: integer("duration_ms"),
    ...timestamps,
  },
  (t) => [
    adminAll("analytics_pageviews"),
    index("analytics_pageviews_path_idx").on(t.path, t.occurredAt),
    index("analytics_pageviews_session_idx").on(t.sessionId),
  ],
);

/** The single internal conversion vocabulary (§13D). */
export const ANALYTICS_EVENT_NAMES = [
  "booking_started",
  "booking_step",
  "booking_completed",
  "contact_submitted",
  "whatsapp_clicked",
  "call_clicked",
  "testimonial_submitted",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    sessionId: uuid("session_id").references(() => analyticsSessions.id, { onDelete: "cascade" }),
    name: text("name").$type<AnalyticsEventName>().notNull(),
    path: text("path").notNull(),
    /** Event-specific properties; never personal data. */
    props: jsonb("props")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default({}),
    /** Shared with Meta CAPI / browser pixel for de-duplication. */
    eventId: text("event_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (t) => [
    adminAll("analytics_events"),
    index("analytics_events_name_idx").on(t.name, t.occurredAt),
    uniqueIndex("analytics_events_event_id_uidx").on(t.eventId),
  ],
);

export const analyticsDailyRollup = pgTable(
  "analytics_daily_rollup",
  {
    id: id(),
    day: date("day", { mode: "date" }).notNull(),
    path: text("path").notNull(),
    pageviews: integer("pageviews").notNull().default(0),
    visitors: integer("visitors").notNull().default(0),
    sessions: integer("sessions").notNull().default(0),
    /** `{ [eventName]: count }` */
    events: jsonb("events")
      .$type<Partial<Record<AnalyticsEventName, number>>>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (t) => [
    adminAll("analytics_daily_rollup"),
    uniqueIndex("analytics_daily_rollup_day_path_uidx").on(t.day, t.path),
  ],
);
