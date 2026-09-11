/**
 * Redirect engine, 404 log, sitemap control, IndexNow log and search-performance cache
 * (CLAUDE.md §5 "URL rules", §8 "Crawl & indexing"; Phase 6).
 *
 * `redirects` moved here from `seo.ts` in Phase 6 so the SEO-override tables and the redirect
 * engine have separate owners. Column names are unchanged; the table is extended in place.
 */
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
import { adminAll } from "./_policies";
import { id, timestamps } from "./_shared";

// ---------------------------------------------------------------------------------------------
// redirects
// ---------------------------------------------------------------------------------------------

/** How `from_path` is matched against the request pathname. */
export const REDIRECT_MATCH_TYPES = ["exact", "wildcard", "regex"] as const;
export type RedirectMatchType = (typeof REDIRECT_MATCH_TYPES)[number];
export const redirectMatchTypeEnum = pgEnum("redirect_match_type", REDIRECT_MATCH_TYPES);

/** Where the rule came from; `slug_change` rules are created automatically and non-optionally. */
export const REDIRECT_SOURCES = ["manual", "slug_change", "not_found_fix", "import"] as const;
export type RedirectSource = (typeof REDIRECT_SOURCES)[number];
export const redirectSourceEnum = pgEnum("redirect_source", REDIRECT_SOURCES);

/** Allowed HTTP statuses; 410 marks content intentionally removed and needs no `to_path`. */
export const REDIRECT_STATUSES = [301, 302, 307, 308, 410] as const;
export type RedirectStatus = (typeof REDIRECT_STATUSES)[number];

export const redirects = pgTable(
  "redirects",
  {
    id: id(),
    /** Exact path, wildcard pattern (`/old/*`) or regex source (`^/old/(\d+)$`), per matchType. */
    fromPath: text("from_path").notNull(),
    /** Null only when `statusCode` is 410 (gone). May contain `$1`/`:splat` for pattern rules. */
    toPath: text("to_path"),
    matchType: redirectMatchTypeEnum("match_type").notNull().default("exact"),
    /** 301, 302, 307, 308 or 410. */
    statusCode: integer("status_code").notNull().default(301),
    isActive: boolean("is_active").notNull().default(true),
    hitCount: integer("hit_count").notNull().default(0),
    lastHitAt: timestamp("last_hit_at", { withTimezone: true, mode: "date" }),
    note: text("note"),
    source: redirectSourceEnum("source").notNull().default("manual"),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the proxy resolves redirects with the service role. */
    adminAll("redirects"),
    uniqueIndex("redirects_from_path_uidx").on(t.fromPath),
    index("redirects_active_idx").on(t.isActive),
  ],
);

// ---------------------------------------------------------------------------------------------
// not_found_log — one row per 404'd path, counted, so the owner can fix the popular ones.
// ---------------------------------------------------------------------------------------------

export const notFoundLog = pgTable(
  "not_found_log",
  {
    id: id(),
    path: text("path").notNull(),
    hits: integer("hits").notNull().default(1),
    firstSeen: timestamp("first_seen", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    lastSeen: timestamp("last_seen", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    /** Origin of the last referrer only (no query strings): never personal data. */
    lastReferrer: text("last_referrer"),
    /** Set once a redirect has been created for this path; the row stays for history. */
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => [
    adminAll("not_found_log"),
    uniqueIndex("not_found_log_path_uidx").on(t.path),
    index("not_found_log_hits_idx").on(t.hits),
  ],
);

// ---------------------------------------------------------------------------------------------
// sitemap_config — per-section include/exclude and per-page overrides read by src/lib/sitemaps.
// ---------------------------------------------------------------------------------------------

/** Keyed by sitemap section: `pages`, `geo-astrology`, `geo-vastu`, `learn`, `images`. */
export type SitemapPageOverride = {
  included?: boolean;
  priority?: number;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
};

export const sitemapConfig = pgTable(
  "sitemap_config",
  {
    id: id(),
    section: text("section").notNull(),
    included: boolean("included").notNull().default(true),
    /** `{ "/route": { included, priority, changeFrequency } }` — per-page overrides. */
    perPage: jsonb("per_page").$type<Record<string, SitemapPageOverride>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [adminAll("sitemap_config"), uniqueIndex("sitemap_config_section_uidx").on(t.section)],
);

// ---------------------------------------------------------------------------------------------
// indexnow_log — every submission to the IndexNow endpoint (manual or automatic).
// ---------------------------------------------------------------------------------------------

export const INDEXNOW_STATUSES = ["submitted", "skipped", "failed"] as const;
export type IndexNowStatus = (typeof INDEXNOW_STATUSES)[number];

export const indexnowLog = pgTable(
  "indexnow_log",
  {
    id: id(),
    urls: jsonb("urls").$type<string[]>().notNull(),
    status: text("status").$type<IndexNowStatus>().notNull(),
    /** Endpoint HTTP status + body excerpt, or the reason a submission was skipped. */
    response: text("response"),
    /** `manual`, `slug_change`, `page_seo`, `sitemap` … — what triggered the submission. */
    trigger: text("trigger").notNull().default("manual"),
    ...timestamps,
  },
  (t) => [adminAll("indexnow_log"), index("indexnow_log_created_idx").on(t.createdAt)],
);

// ---------------------------------------------------------------------------------------------
// search_performance_cache — 1 h cache of Google Search Console / Bing Webmaster responses.
// ---------------------------------------------------------------------------------------------

export const searchPerformanceCache = pgTable(
  "search_performance_cache",
  {
    id: id(),
    /** `google` or `bing`. */
    provider: text("provider").notNull(),
    /** Query identity, e.g. `pages:28d`. */
    cacheKey: text("cache_key").notNull(),
    payload: jsonb("payload").$type<unknown>().notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (t) => [
    adminAll("search_performance_cache"),
    uniqueIndex("search_performance_cache_key_uidx").on(t.provider, t.cacheKey),
  ],
);
