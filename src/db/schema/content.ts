/**
 * Editorial content: FAQs, Learn articles, glossary terms and client testimonials.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminAll, publicInsert, publicSelect } from "./_policies";
import { id, timestamps } from "./_shared";
import { locations } from "./locations";
import { services } from "./services";

// ---------------------------------------------------------------------------------------------
// faqs — attachable to a route pattern and/or a location; every geo page has an FAQ block.
// ---------------------------------------------------------------------------------------------

export const faqs = pgTable(
  "faqs",
  {
    id: id(),
    /** Route this FAQ belongs to, e.g. `/`, `/services/kundli-analysis`, `/astrologer/*`. */
    routePattern: text("route_pattern"),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }),
    /** Phrased as a real question a person would type or say (§9.2). */
    question: text("question").notNull(),
    /** 40–60 word self-contained answer naming the subject explicitly (§9.2). */
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    /** Anyone may read published FAQs. */
    publicSelect("faqs", sql`${t.isPublished} = true`),
    adminAll("faqs"),
    index("faqs_route_idx").on(t.routePattern, t.sortOrder),
    index("faqs_location_idx").on(t.locationId),
  ],
);

// ---------------------------------------------------------------------------------------------
// article_categories / articles — the Learn hub.
// ---------------------------------------------------------------------------------------------

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export const contentStatusEnum = pgEnum("content_status", CONTENT_STATUSES);

export const articleCategories = pgTable(
  "article_categories",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    /** Category hubs are public. */
    publicSelect("article_categories"),
    adminAll("article_categories"),
    uniqueIndex("article_categories_slug_uidx").on(t.slug),
  ],
);

export const articles = pgTable(
  "articles",
  {
    id: id(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => articleCategories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    /** The question cluster this article answers (§9.10). */
    primaryQuestion: text("primary_question").notNull(),
    excerpt: text("excerpt").notNull(),
    bodyMd: text("body_md").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    /** Real content mtime shown as dateModified and used for sitemap lastmod. */
    contentUpdatedAt: timestamp("content_updated_at", { withTimezone: true, mode: "date" }),
    readingTimeMinutes: smallint("reading_time_minutes"),
    ...timestamps,
  },
  (t) => [
    /** Anyone may read published articles; drafts and archived pieces are admin-only. */
    publicSelect("articles", sql`${t.status} = 'published'`),
    adminAll("articles"),
    uniqueIndex("articles_category_slug_uidx").on(t.categoryId, t.slug),
    index("articles_status_published_idx").on(t.status, t.publishedAt),
  ],
);

// ---------------------------------------------------------------------------------------------
// glossary_terms — one page per term (DefinedTerm schema).
// ---------------------------------------------------------------------------------------------

export const glossaryTerms = pgTable(
  "glossary_terms",
  {
    id: id(),
    slug: text("slug").notNull(),
    term: text("term").notNull(),
    /** Original-script spelling (Devanagari etc.) where helpful. */
    transliteration: text("transliteration"),
    /** One-sentence definition (the DefinedTerm `description`). */
    shortDefinition: text("short_definition").notNull(),
    bodyMd: text("body_md").notNull(),
    relatedSlugs: text("related_slugs").array().notNull().default([]),
    status: contentStatusEnum("status").notNull().default("draft"),
    contentUpdatedAt: timestamp("content_updated_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => [
    /** Anyone may read published terms. */
    publicSelect("glossary_terms", sql`${t.status} = 'published'`),
    adminAll("glossary_terms"),
    uniqueIndex("glossary_terms_slug_uidx").on(t.slug),
  ],
);

// ---------------------------------------------------------------------------------------------
// testimonials — only real, consented client feedback is ever published (§12).
// ---------------------------------------------------------------------------------------------

export const TESTIMONIAL_SOURCES = [
  "website_form",
  "email",
  "whatsapp",
  "google",
  "other",
] as const;
export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[number];
export const testimonialSourceEnum = pgEnum("testimonial_source", TESTIMONIAL_SOURCES);

export const testimonials = pgTable(
  "testimonials",
  {
    id: id(),
    clientName: text("client_name").notNull(),
    clientLocationId: uuid("client_location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    quote: text("quote").notNull(),
    /** 1–5, null when the client gave no rating. Never invented. */
    rating: smallint("rating"),
    /** Date of the consultation or of the feedback, as the client stated it. */
    date: date("date", { mode: "date" }),
    source: testimonialSourceEnum("source").notNull().default("website_form"),
    /** Explicit permission to publish. Required for `is_published` to have any effect. */
    consentGiven: boolean("consent_given").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    /** Marks clearly-labelled placeholder copy; the build gate fails production while any is
     *  published or rendered. */
    isPlaceholder: boolean("is_placeholder").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    /** Anyone may read testimonials that are both published and consented. */
    publicSelect("testimonials", sql`${t.isPublished} = true and ${t.consentGiven} = true`),
    /** Visitors may submit a testimonial, but only as an unpublished, non-placeholder row. */
    publicInsert(
      "testimonials",
      sql`${t.isPublished} = false and ${t.isPlaceholder} = false and (${t.rating} is null or ${t.rating} between 1 and 5)`,
    ),
    adminAll("testimonials"),
    index("testimonials_published_idx").on(t.isPublished, t.consentGiven),
  ],
);
