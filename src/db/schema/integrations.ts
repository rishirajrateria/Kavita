/**
 * Third-party integrations, search-engine verification, visitor consent and conversion fan-out
 * (CLAUDE.md §10, §13; Phase 6, P6-C).
 *
 * `integrations`, `verification_tags` and `consent_log` moved here from `site.ts` in Phase 6 so
 * the integrations panel has one owner. Column names are unchanged; `integrations` is extended
 * in place with test-connection bookkeeping. New in Phase 6: `event_mappings` (internal event →
 * provider event), `capi_log` (every server-side Meta Conversions API send, redacted) and
 * `consent_config` (the single admin-editable banner/regions row).
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { adminAll, publicInsert } from "./_policies";
import { id, timestamps } from "./_shared";

// ---------------------------------------------------------------------------------------------
// integrations — every pixel/tag/API connection, off until an ID is entered (§13).
// ---------------------------------------------------------------------------------------------

export const INTEGRATION_PROVIDERS = [
  "google_search_console",
  "bing_webmaster",
  "meta_pixel",
  "meta_capi",
  "google_tag",
  "google_ads",
  "ga4",
  "linkedin_insight",
  "pinterest_tag",
  "tiktok_pixel",
  "microsoft_uet",
  "gtm",
  "custom_head",
  "custom_body",
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];
export const integrationProviderEnum = pgEnum("integration_provider", INTEGRATION_PROVIDERS);

/**
 * Provider-specific config. Fields the provider registry marks `secret` are stored as
 * `enc:v1:<base64>` envelopes (AES-256-GCM, `src/lib/crypto/secrets.ts`); everything else is
 * plain. Never send a row's `config` to the browser — use the public projection.
 */
export type IntegrationConfig = Record<string, string | number | boolean | null>;

/** Outcome of the last admin "test connection" click. */
export const INTEGRATION_TEST_STATUSES = ["ok", "failed", "untested"] as const;
export type IntegrationTestStatus = (typeof INTEGRATION_TEST_STATUSES)[number];

export const integrations = pgTable(
  "integrations",
  {
    id: id(),
    provider: integrationProviderEnum("provider").notNull(),
    config: jsonb("config").$type<IntegrationConfig>().notNull().default({}),
    isEnabled: boolean("is_enabled").notNull().default(false),
    /** ISO 3166-1 alpha-2 codes the tag may load in; empty = everywhere (subject to consent). */
    loadsInRegions: text("loads_in_regions").array().notNull().default([]),
    updatedBy: text("updated_by"),
    /** Set by the admin test-connection action; `null` until first tested. */
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true, mode: "date" }),
    lastTestStatus: text("last_test_status").$type<IntegrationTestStatus>(),
    lastTestMessage: text("last_test_message"),
    /** Free-form owner notes ("campaign X", "asked agency for the label"). */
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    /** Contains credentials: admin-only; the server component reads it with the service role. */
    adminAll("integrations"),
    uniqueIndex("integrations_provider_uidx").on(t.provider),
  ],
);

// ---------------------------------------------------------------------------------------------
// verification_tags — search-engine site verification (meta tag or hosted file).
// ---------------------------------------------------------------------------------------------

export const VERIFICATION_KINDS = ["meta", "file"] as const;
export type VerificationKind = (typeof VERIFICATION_KINDS)[number];
export const verificationKindEnum = pgEnum("verification_kind", VERIFICATION_KINDS);

export const verificationTags = pgTable(
  "verification_tags",
  {
    id: id(),
    /** e.g. google, bing, pinterest, facebook_domain, yandex, other */
    provider: text("provider").notNull(),
    kind: verificationKindEnum("kind").notNull(),
    metaName: text("meta_name"),
    metaContent: text("meta_content"),
    filePath: text("file_path"),
    fileContent: text("file_content"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; rendered server-side, never queried from the browser. */
    adminAll("verification_tags"),
    uniqueIndex("verification_tags_provider_kind_uidx").on(t.provider, t.kind),
  ],
);

// ---------------------------------------------------------------------------------------------
// consent_log — append-only record of cookie/pixel consent choices (§13E).
// ---------------------------------------------------------------------------------------------

export type ConsentChoices = { analytics: boolean; marketing: boolean };

export const consentLog = pgTable(
  "consent_log",
  {
    id: id(),
    /** Anonymous visitor id (analytics visitor hash when present, else random); never an identity. */
    visitorId: text("visitor_id").notNull(),
    /** ISO 3166-1 alpha-2 from the edge geo header. */
    region: text("region"),
    choices: jsonb("choices").$type<ConsentChoices>().notNull(),
    policyVersion: text("policy_version").notNull(),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    /** Visitors may record a choice but never read the log back. */
    publicInsert("consent_log", sql`true`),
    adminAll("consent_log"),
    index("consent_log_visitor_idx").on(t.visitorId, t.createdAt),
  ],
);

// ---------------------------------------------------------------------------------------------
// consent_config — the single admin-editable banner copy + consent-region list (§13E).
// ---------------------------------------------------------------------------------------------

export const consentConfig = pgTable(
  "consent_config",
  {
    id: id(),
    /** Bumped by the admin when the banner copy or scope changes; stored on every log row. */
    policyVersion: text("policy_version").notNull().default("2026-09"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    acceptLabel: text("accept_label").notNull().default("Accept"),
    rejectLabel: text("reject_label").notNull().default("Reject"),
    /** ISO 3166-1 alpha-2 codes where third-party tags wait for consent (UK, EU/EEA, CH default). */
    consentRegions: text("consent_regions").array().notNull().default([]),
    /** When the edge sends no country header, treat the visitor as inside a consent region. */
    unknownRegionRequiresConsent: boolean("unknown_region_requires_consent")
      .notNull()
      .default(true),
    updatedBy: text("updated_by"),
    ...timestamps,
  },
  () => [
    /** Admin-only; the banner is server-rendered from this row. */
    adminAll("consent_config"),
    /** Enforces the single-row invariant. */
    uniqueIndex("consent_config_singleton_uidx").on(sql`(true)`),
  ],
);

// ---------------------------------------------------------------------------------------------
// event_mappings — internal conversion vocabulary → each ad platform's event name (§13D).
// ---------------------------------------------------------------------------------------------

/** Extra parameters sent with the provider event; values may reference payload keys as `{key}`. */
export type EventMappingParams = Record<string, string | number | boolean | null>;

export const eventMappings = pgTable(
  "event_mappings",
  {
    id: id(),
    provider: integrationProviderEnum("provider").notNull(),
    /** One of `CONVERSION_EVENTS` in `src/lib/events.ts`. */
    internalEvent: text("internal_event").notNull(),
    /** Provider event name (`Schedule`, `generate_lead`, `conversion`, …). */
    providerEvent: text("provider_event").notNull(),
    params: jsonb("params").$type<EventMappingParams>().notNull().default({}),
    isEnabled: boolean("is_enabled").notNull().default(true),
    updatedBy: text("updated_by"),
    ...timestamps,
  },
  (t) => [
    adminAll("event_mappings"),
    uniqueIndex("event_mappings_provider_event_uidx").on(t.provider, t.internalEvent),
  ],
);

// ---------------------------------------------------------------------------------------------
// capi_log — every server-side Conversions API send, request and response redacted (§13C).
// ---------------------------------------------------------------------------------------------

export const CAPI_STATUSES = ["sent", "failed", "skipped"] as const;
export type CapiStatus = (typeof CAPI_STATUSES)[number];

export const capiLog = pgTable(
  "capi_log",
  {
    id: id(),
    provider: text("provider").notNull().default("meta_capi"),
    internalEvent: text("internal_event").notNull(),
    providerEvent: text("provider_event").notNull(),
    /** Shared with the browser pixel for de-duplication. */
    eventId: text("event_id").notNull(),
    status: text("status").$type<CapiStatus>().notNull(),
    httpStatus: integer("http_status"),
    /** Redacted payload: hashed user data replaced by field names, tokens never included. */
    request: jsonb("request").$type<Record<string, unknown>>().notNull().default({}),
    response: jsonb("response").$type<Record<string, unknown>>(),
    testEventCode: text("test_event_code"),
    errorMessage: text("error_message"),
    ...timestamps,
  },
  (t) => [
    adminAll("capi_log"),
    index("capi_log_created_idx").on(t.createdAt),
    index("capi_log_event_idx").on(t.eventId),
  ],
);
