/**
 * IndexNow with a log (Phase 6, P6-B). Wraps `submitIndexNow()` from Phase 2 so every
 * submission — manual from `/admin/indexing`, automatic on slug change or a page_seo save —
 * lands in `indexnow_log` with its status and the endpoint's answer. "Skipped" rows are logged
 * too (no key, nothing on this host), so the owner can see why nothing was sent.
 *
 * Other agents: call `submitIndexNowLogged(urls, "page_seo")` from publish paths.
 */
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { indexnowLog, type IndexNowStatus } from "@/db/schema/redirects";
import {
  buildIndexNowPayload,
  getIndexNowKey,
  submitIndexNow,
  type IndexNowResult,
} from "@/lib/indexnow";
import { absoluteUrl } from "@/lib/site";
import { sitemapSectionEntries } from "@/lib/sitemaps";
import { SITEMAP_SECTIONS } from "./sitemap-config";
import type { RedirectDb } from "./store";

export interface LoggedSubmission extends IndexNowResult {
  logStatus: IndexNowStatus;
  urls: string[];
}

export async function submitIndexNowLogged(
  urls: readonly string[],
  trigger: string,
  db: RedirectDb | null = getDb(),
  fetchImpl: typeof fetch = fetch,
): Promise<LoggedSubmission> {
  const key = getIndexNowKey();
  const absolute = key ? buildIndexNowPayload(urls, key).urlList : urls.map((u) => absoluteUrl(u));
  let result: IndexNowResult;
  try {
    result = await submitIndexNow(urls, fetchImpl);
  } catch (error) {
    result = {
      submitted: 0,
      status: null,
      ok: false,
      message: `network error: ${error instanceof Error ? error.name : "unknown"}`,
    };
  }
  const logStatus: IndexNowStatus = result.ok
    ? "submitted"
    : result.status === null
      ? "skipped"
      : "failed";
  if (db) {
    try {
      await db.insert(indexnowLog).values({
        urls: absolute,
        status: logStatus,
        response: result.status === null ? result.message : `${result.status} ${result.message}`,
        trigger,
      });
    } catch {
      /* a log failure must never break the publish path */
    }
  }
  return { ...result, logStatus, urls: absolute };
}

export type IndexNowLogRow = typeof indexnowLog.$inferSelect;

export async function listIndexNowLog(limit = 50): Promise<IndexNowLogRow[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(indexnowLog).orderBy(desc(indexnowLog.createdAt)).limit(limit);
}

/** Every sitemap URL whose `lastmod` is on or after `since` (`YYYY-MM-DD`) — "all changed since". */
export async function urlsChangedSince(since: string): Promise<string[]> {
  const out = new Set<string>();
  for (const s of SITEMAP_SECTIONS) {
    for (const e of await sitemapSectionEntries(s.key)) {
      if (e.lastmod && e.lastmod.slice(0, 10) >= since) out.add(e.loc);
    }
  }
  return [...out];
}
