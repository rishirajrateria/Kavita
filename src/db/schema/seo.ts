/**
 * Per-route SEO overrides and the redirect engine (CLAUDE.md §5, §10; Phase 6 fills the UI).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { adminAll, publicSelect } from "./_policies";
import { id, timestamps } from "./_shared";

export const pageSeo = pgTable(
  "page_seo",
  {
    id: id(),
    /** Absolute route path, no trailing slash, e.g. `/astrologer/india/maharashtra/mumbai`. */
    route: text("route").notNull(),
    title: text("title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    noindex: boolean("noindex").notNull().default(false),
    nofollow: boolean("nofollow").notNull().default(false),
    ogImageUrl: text("og_image_url"),
    /** Extra or overriding JSON-LD nodes merged into the page's graph. */
    structuredDataOverrides: jsonb("structured_data_overrides").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    /** Overrides are rendered server-side but hold nothing sensitive; public read keeps the
     *  markdown mirror and llms.txt generators simple. */
    publicSelect("page_seo"),
    adminAll("page_seo"),
    uniqueIndex("page_seo_route_uidx").on(t.route),
  ],
);

export const redirects = pgTable(
  "redirects",
  {
    id: id(),
    fromPath: text("from_path").notNull(),
    /** Null only when `statusCode` is 410 (gone). */
    toPath: text("to_path"),
    /** 301, 302, 307, 308 or 410. */
    statusCode: integer("status_code").notNull().default(301),
    isActive: boolean("is_active").notNull().default(true),
    hitCount: integer("hit_count").notNull().default(0),
    lastHitAt: timestamp("last_hit_at", { withTimezone: true, mode: "date" }),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the middleware resolves redirects with the service role. */
    adminAll("redirects"),
    uniqueIndex("redirects_from_path_uidx").on(t.fromPath),
    index("redirects_active_idx").on(t.isActive),
  ],
);
