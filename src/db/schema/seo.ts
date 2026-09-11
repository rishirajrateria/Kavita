/**
 * SEO control tables (CLAUDE.md §5, §8, §9, §10; Phase 6 P6-A): per-route overrides, FAQ
 * attachments, answer-block overrides, editable site documents (llms.txt, /for-ai, OG
 * templates), AI-crawler toggles and the OG image library. The `redirects` table lives in
 * `./redirects.ts` (P6-B).
 *
 * Everything here is public-readable: it is rendered into public pages and holds nothing
 * sensitive. Writes are admin-only and go through `/api/admin/*` route handlers.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminAll, publicSelect } from "./_policies";
import { id, timestamps } from "./_shared";
import { adminUsers } from "./admin";
import { faqs } from "./content";

// ---------------------------------------------------------------------------------------------
// page_seo — per-route overrides, resolved by pattern specificity at render time.
// ---------------------------------------------------------------------------------------------

export const ROBOTS_IMAGE_PREVIEWS = ["none", "standard", "large"] as const;
export type RobotsImagePreview = (typeof ROBOTS_IMAGE_PREVIEWS)[number];

/** Robots directives; every field optional so an override only touches what the admin set. */
export interface RobotsDirectives {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  /** `max-snippet:N`; `-1` = no limit. */
  maxSnippet?: number;
  maxImagePreview?: RobotsImagePreview;
}

export const OG_TYPES = ["website", "article", "profile"] as const;
export type OgType = (typeof OG_TYPES)[number];
export const TWITTER_CARDS = ["summary", "summary_large_image"] as const;
export type TwitterCard = (typeof TWITTER_CARDS)[number];

export const pageSeo = pgTable(
  "page_seo",
  {
    id: id(),
    /**
     * Exact route (`/about`) or glob (`/astrologer/india/*`, `*` matches any characters
     * including `/`). Resolution: exact > longest literal prefix > fewest wildcards. The DB
     * column keeps its Phase 1 name `route`.
     */
    routePattern: text("route").notNull(),
    title: text("title"),
    metaDescription: text("meta_description"),
    h1Override: text("h1_override"),
    /** Absolute canonical override; the page's own self-referencing canonical otherwise. */
    canonicalUrl: text("canonical_url"),
    /** Phase 1 booleans, kept for compatibility; `robots` wins when set. */
    noindex: boolean("noindex").notNull().default(false),
    nofollow: boolean("nofollow").notNull().default(false),
    robots: jsonb("robots").$type<RobotsDirectives>(),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImageUrl: text("og_image_url"),
    ogType: text("og_type").$type<OgType>(),
    /** Text rendered on the generated `/api/og` image when no image URL is set. */
    ogText: text("og_text"),
    twitterCard: text("twitter_card").$type<TwitterCard>(),
    twitterTitle: text("twitter_title"),
    twitterDescription: text("twitter_description"),
    twitterImageUrl: text("twitter_image_url"),
    /** The one primary keyword the page targets (§8), checked by the editor's checklist. */
    keywordFocus: text("keyword_focus"),
    /** Sanitised on save: only `<meta>`, `<link>` and `<script type="application/ld+json">`. */
    customHeadHtml: text("custom_head_html"),
    /** `{ "en-IN": "https://…", "x-default": "https://…" }`. */
    hreflang: jsonb("hreflang").$type<Record<string, string>>(),
    /** Extra or overriding JSON-LD nodes merged into the page's graph. */
    structuredDataOverrides: jsonb("structured_data_overrides").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Overrides are rendered server-side but hold nothing sensitive; public read keeps the
     *  markdown mirror and llms.txt generators simple. */
    publicSelect("page_seo"),
    adminAll("page_seo"),
    uniqueIndex("page_seo_route_uidx").on(t.routePattern),
  ],
);

export type PageSeoRow = typeof pageSeo.$inferSelect;

// ---------------------------------------------------------------------------------------------
// faq_attachments — one FAQ shown on many routes (bulk attach by pattern).
// ---------------------------------------------------------------------------------------------

export const faqAttachments = pgTable(
  "faq_attachments",
  {
    id: id(),
    faqId: uuid("faq_id")
      .notNull()
      .references(() => faqs.id, { onDelete: "cascade" }),
    /** Exact route or glob, same grammar as `page_seo.route`. */
    routePattern: text("route_pattern").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    publicSelect("faq_attachments", sql`${t.isPublished} = true`),
    adminAll("faq_attachments"),
    uniqueIndex("faq_attachments_faq_route_uidx").on(t.faqId, t.routePattern),
    index("faq_attachments_route_idx").on(t.routePattern, t.sortOrder),
  ],
);

export type FaqAttachment = typeof faqAttachments.$inferSelect;

// ---------------------------------------------------------------------------------------------
// page_answers — per-page answer-block and key-facts overrides (§9.2, §9.3).
// ---------------------------------------------------------------------------------------------

export interface KeyFact {
  label: string;
  value: string;
}

export const pageAnswers = pgTable(
  "page_answers",
  {
    id: id(),
    /** Exact route only: an answer is specific to one page. */
    route: text("route").notNull(),
    /** The H2's `id` attribute (or `key-facts` for the key-facts block). */
    h2Id: text("h2_id").notNull(),
    /** 40–60 word self-contained answer; empty when the row only carries key facts. */
    answer: text("answer").notNull().default(""),
    keyFacts: jsonb("key_facts").$type<KeyFact[]>(),
    ...timestamps,
  },
  (t) => [
    publicSelect("page_answers"),
    adminAll("page_answers"),
    uniqueIndex("page_answers_route_h2_uidx").on(t.route, t.h2Id),
  ],
);

export type PageAnswer = typeof pageAnswers.$inferSelect;

// ---------------------------------------------------------------------------------------------
// site_documents — admin-edited configuration blobs keyed by name.
// ---------------------------------------------------------------------------------------------

/** Known keys; the column is free text so a later phase can add one without a migration. */
export const SITE_DOCUMENT_KEYS = ["llms", "for_ai", "og_templates"] as const;
export type SiteDocumentKey = (typeof SITE_DOCUMENT_KEYS)[number];

export const siteDocuments = pgTable(
  "site_documents",
  {
    id: id(),
    key: text("key").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    publicSelect("site_documents"),
    adminAll("site_documents"),
    uniqueIndex("site_documents_key_uidx").on(t.key),
  ],
);

export type SiteDocument = typeof siteDocuments.$inferSelect;

// ---------------------------------------------------------------------------------------------
// robots_bots — per-crawler allow/disallow, read by robots.txt (§9.7).
// ---------------------------------------------------------------------------------------------

export const robotsBots = pgTable(
  "robots_bots",
  {
    id: id(),
    /** The `User-agent` token, e.g. `GPTBot`. */
    agent: text("agent").notNull(),
    allow: boolean("allow").notNull().default(true),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    publicSelect("robots_bots"),
    adminAll("robots_bots"),
    uniqueIndex("robots_bots_agent_uidx").on(t.agent),
  ],
);

export type RobotsBot = typeof robotsBots.$inferSelect;

// ---------------------------------------------------------------------------------------------
// og_images — the social image library (Supabase Storage bucket `og-library`).
// ---------------------------------------------------------------------------------------------

export const OG_LIBRARY_BUCKET = "og-library";

export const ogImages = pgTable(
  "og_images",
  {
    id: id(),
    /** Object path inside the `og-library` bucket. */
    storagePath: text("storage_path").notNull(),
    /** Public URL of the object, computed at upload time. */
    publicUrl: text("public_url").notNull(),
    label: text("label").notNull(),
    alt: text("alt").notNull().default(""),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes").notNull(),
    contentType: text("content_type").notNull(),
    ...timestamps,
  },
  (t) => [
    publicSelect("og_images"),
    adminAll("og_images"),
    uniqueIndex("og_images_path_uidx").on(t.storagePath),
  ],
);

export type OgImage = typeof ogImages.$inferSelect;
