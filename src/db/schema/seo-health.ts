/**
 * SEO health crawls (Phase 6, P6-D). A crawl run walks the live site from `/` (seeded with the
 * route registry and the sitemaps), records one `seo_findings` row per problem, and stores its
 * resumable cursor in `state` so an on-demand run can stop at the 60-second request budget and
 * continue on the next request. The weekly cron runs the same engine.
 */
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminAll } from "./_policies";
import { id, timestamps } from "./_shared";

export const SEO_CRAWL_STATUSES = ["running", "paused", "completed", "failed"] as const;
export type SeoCrawlStatus = (typeof SEO_CRAWL_STATUSES)[number];
export const seoCrawlStatusEnum = pgEnum("seo_crawl_status", SEO_CRAWL_STATUSES);

export const SEO_CRAWL_TRIGGERS = ["manual", "cron"] as const;
export type SeoCrawlTrigger = (typeof SEO_CRAWL_TRIGGERS)[number];
export const seoCrawlTriggerEnum = pgEnum("seo_crawl_trigger", SEO_CRAWL_TRIGGERS);

export const SEO_FINDING_SEVERITIES = ["error", "warning", "info"] as const;
export type SeoFindingSeverity = (typeof SEO_FINDING_SEVERITIES)[number];
export const seoFindingSeverityEnum = pgEnum("seo_finding_severity", SEO_FINDING_SEVERITIES);

/** Per-page record kept in the crawl state for the cross-page checks that run at the end. */
export interface SeoCrawlPageRecord {
  status: number;
  /** `true` when the response was an HTML document (checks ran); files and errors are `false`. */
  html: boolean;
  title: string | null;
  description: string | null;
  /** Final path after redirects, when the fetch was redirected. */
  redirectedTo?: string;
  /** Paths this page links to (same-origin, normalised). */
  links: string[];
  noindex: boolean;
  words: number;
  /** Citability score (0–100) when the scorer ran. */
  citability?: number | null;
}

/** Resumable cursor: everything the crawler needs to continue after a budget stop. */
export interface SeoCrawlState {
  origin: string;
  queue: string[];
  visited: string[];
  pages: Record<string, SeoCrawlPageRecord>;
  /** URLs listed in the sitemaps (paths), for the orphan and "in sitemap?" checks. */
  sitemapPaths: string[];
  /** Whether the sitemap seeds were loaded (they are fetched once, at the start). */
  seeded: boolean;
}

export interface SeoCrawlSummary {
  byType: Record<string, number>;
  bySeverity: Record<SeoFindingSeverity, number>;
  pages: number;
  /** Average citability score (0–100) across scored pages, when the scorer is available. */
  citabilityAverage?: number;
}

export const seoCrawls = pgTable(
  "seo_crawls",
  {
    id: id(),
    status: seoCrawlStatusEnum("status").notNull().default("running"),
    trigger: seoCrawlTriggerEnum("trigger").notNull().default("manual"),
    /** Origin crawled, e.g. `https://astrologerkavita.com` — the request's own host. */
    origin: text("origin").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
    /** Milliseconds spent across all segments (a paused crawl accumulates). */
    elapsedMs: integer("elapsed_ms").notNull().default(0),
    pagesCrawled: integer("pages_crawled").notNull().default(0),
    pagesDiscovered: integer("pages_discovered").notNull().default(0),
    state: jsonb("state").$type<SeoCrawlState>(),
    summary: jsonb("summary").$type<SeoCrawlSummary>(),
    error: text("error"),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; the crawler writes with the service role. */
    adminAll("seo_crawls"),
    index("seo_crawls_started_idx").on(t.startedAt),
  ],
);

export const seoFindings = pgTable(
  "seo_findings",
  {
    id: id(),
    crawlId: uuid("crawl_id")
      .notNull()
      .references(() => seoCrawls.id, { onDelete: "cascade" }),
    /** Site-relative path the finding is about. */
    path: text("path").notNull(),
    /** One of `SEO_FINDING_TYPES` in `src/lib/seo-health/types.ts`. */
    type: text("type").notNull(),
    severity: seoFindingSeverityEnum("severity").notNull().default("warning"),
    message: text("message").notNull(),
    /** Type-specific detail: the duplicate's sibling paths, the broken href, the chain hops… */
    details: jsonb("details").$type<Record<string, unknown>>(),
    /** Admin route that fixes the finding (`/admin/seo/…`, `/admin/redirects?prefill=…`). */
    fixHref: text("fix_href"),
    ...timestamps,
  },
  (t) => [
    adminAll("seo_findings"),
    index("seo_findings_crawl_idx").on(t.crawlId, t.severity),
    index("seo_findings_type_idx").on(t.crawlId, t.type),
    index("seo_findings_path_idx").on(t.crawlId, t.path),
  ],
);
