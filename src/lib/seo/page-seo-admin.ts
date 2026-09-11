/**
 * Admin writes for `page_seo` (Phase 6 P6-A): sanitise the custom head, fold the robots form
 * fields into the jsonb column and upsert by route pattern (or update by id).
 */
import { eq } from "drizzle-orm";
import type { BookingDb as Db } from "@/lib/booking/db";
import { pageSeo, type PageSeoRow, type RobotsDirectives } from "@/db/schema/seo";
import type { PageSeoInput } from "./admin-schemas";
import { sanitizeHeadHtml } from "./sanitize-head";

export interface PageSeoSaveResult {
  before: PageSeoRow | null;
  after: PageSeoRow | null;
  /** Sanitiser warnings for the custom head snippet, shown after save. */
  warnings: string[];
}

export function robotsFromInput(input: PageSeoInput): RobotsDirectives | null {
  const robots: RobotsDirectives = {};
  if (input.robotsIndex !== undefined) robots.index = input.robotsIndex;
  if (input.robotsFollow !== undefined) robots.follow = input.robotsFollow;
  if (input.noarchive) robots.noarchive = true;
  if (input.nosnippet) robots.nosnippet = true;
  if (input.maxSnippet !== undefined) robots.maxSnippet = input.maxSnippet;
  if (input.maxImagePreview) robots.maxImagePreview = input.maxImagePreview;
  return Object.keys(robots).length ? robots : null;
}

export async function getPageSeoById(db: Db, id: string): Promise<PageSeoRow | null> {
  return (await db.select().from(pageSeo).where(eq(pageSeo.id, id)))[0] ?? null;
}

export async function getPageSeoByPattern(db: Db, pattern: string): Promise<PageSeoRow | null> {
  return (await db.select().from(pageSeo).where(eq(pageSeo.routePattern, pattern)))[0] ?? null;
}

export async function savePageSeo(
  db: Db,
  input: PageSeoInput,
  id?: string,
): Promise<PageSeoSaveResult> {
  const head = sanitizeHeadHtml(input.customHeadHtml);
  const robots = robotsFromInput(input);
  const values = {
    routePattern: input.routePattern,
    title: input.title,
    metaDescription: input.metaDescription,
    h1Override: input.h1Override,
    canonicalUrl: input.canonicalUrl,
    noindex: robots?.index === false,
    nofollow: robots?.follow === false,
    robots,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImageUrl: input.ogImageUrl,
    ogType: input.ogType ?? null,
    ogText: input.ogText,
    twitterCard: input.twitterCard ?? null,
    twitterTitle: input.twitterTitle,
    twitterDescription: input.twitterDescription,
    twitterImageUrl: input.twitterImageUrl,
    keywordFocus: input.keywordFocus,
    customHeadHtml: head.html || null,
    hreflang: input.hreflang ?? null,
    structuredDataOverrides: input.structuredDataOverrides ?? null,
    isActive: input.isActive,
  };
  const before = id
    ? await getPageSeoById(db, id)
    : await getPageSeoByPattern(db, input.routePattern);
  if (id && !before) return { before: null, after: null, warnings: head.warnings };
  const [after] = before
    ? await db.update(pageSeo).set(values).where(eq(pageSeo.id, before.id)).returning()
    : await db.insert(pageSeo).values(values).returning();
  return { before, after: after ?? null, warnings: head.warnings };
}

export async function deletePageSeo(db: Db, id: string): Promise<PageSeoRow | null> {
  return (await db.delete(pageSeo).where(eq(pageSeo.id, id)).returning())[0] ?? null;
}
