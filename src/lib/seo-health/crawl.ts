/**
 * The SEO health crawler (Phase 6, P6-D). Walks the site from `/` plus the route registry and
 * the sitemaps as seeds, following same-origin `<a href>` links, four pages at a time, up to
 * 2,000 pages. Every segment is budgeted: `runCrawlSegment()` stops taking new pages once the
 * budget is spent and returns the cursor (`SeoCrawlState`) so the next request — or the weekly
 * cron — continues where it left off. `fetch` is injectable, so the tests drive it with a fake
 * site. No DB access here: `./runner.ts` persists.
 */
import type { SeoCrawlPageRecord, SeoCrawlState } from "@/db/schema/seo-health";
import { listIndexableCoreRoutes, normalisePath } from "@/lib/routes";
import { pageFindings } from "./checks";
import { withFixes } from "./fix-links";
import { isCrawlablePath, parsePage, parseSitemapLocs } from "./parse";
import { CRAWL_LIMITS, type Finding } from "./types";

export const CRAWLER_USER_AGENT = "AstrologerKavita-SEOHealth/1.0 (+/admin/health)";
/** Request header the crawler sends so the site can tell the crawl apart from visitors. */
export const CRAWL_HEADER = "x-seo-health";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface CitabilityResult {
  score: number;
  fixes: string[];
}

export interface CrawlOptions {
  fetch?: FetchLike;
  /** Milliseconds this segment may spend before pausing (default 45 s). */
  budgetMs?: number;
  maxPages?: number;
  concurrency?: number;
  /** Per-request timeout (default 15 s). */
  requestTimeoutMs?: number;
  /** Citability scorer (P6-A); absent → no citability findings. */
  scoreCitability?: (html: string, path: string) => Promise<CitabilityResult | null>;
  now?: () => number;
}

export interface CrawlSegmentResult {
  state: SeoCrawlState;
  /** Page-level findings for the pages crawled in this segment (fix links attached). */
  findings: Finding[];
  /** Pages crawled in this segment. */
  crawled: number;
  /** `true` when the queue is exhausted (or the page ceiling was hit). */
  done: boolean;
  elapsedMs: number;
}

/** A fresh cursor seeded with `/` and every core route that exists. */
export function createCrawlState(origin: string, extraSeeds: string[] = []): SeoCrawlState {
  const seeds = new Set<string>(["/"]);
  for (const r of listIndexableCoreRoutes()) seeds.add(r.path);
  for (const s of extraSeeds) seeds.add(normalisePath(s));
  return {
    origin: new URL(origin).origin,
    queue: [...seeds].filter(isCrawlablePath),
    visited: [],
    pages: {},
    sitemapPaths: [],
    seeded: false,
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function requestInit(timeoutMs: number, accept: string): RequestInit {
  return {
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": CRAWLER_USER_AGENT, accept, [CRAWL_HEADER]: "1" },
  };
}

export interface FetchedPage {
  status: number;
  html: string | null;
  /** Redirect hops as paths (excluding the requested path). */
  hops: string[];
  redirectFailed: boolean;
  finalPath: string;
}

/** Fetch one path, following same-origin redirects up to the hop limit. */
export async function fetchPage(
  origin: string,
  path: string,
  fetchFn: FetchLike,
  timeoutMs: number,
): Promise<FetchedPage> {
  const hops: string[] = [];
  let current = path;
  const seen = new Set([path]);
  for (;;) {
    let response: Response;
    try {
      response = await fetchFn(`${origin}${current}`, requestInit(timeoutMs, "text/html"));
    } catch {
      return { status: 0, html: null, hops, redirectFailed: false, finalPath: current };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          status: response.status,
          html: null,
          hops,
          redirectFailed: false,
          finalPath: current,
        };
      }
      let next: URL;
      try {
        next = new URL(location, `${origin}${current}`);
      } catch {
        return {
          status: response.status,
          html: null,
          hops,
          redirectFailed: true,
          finalPath: current,
        };
      }
      if (next.origin !== origin) {
        // Off-site redirect: treat the hop as final and healthy.
        hops.push(next.href);
        return { status: 200, html: null, hops, redirectFailed: false, finalPath: next.href };
      }
      const nextPath = normalisePath(next.pathname);
      hops.push(nextPath);
      if (seen.has(nextPath) || hops.length > CRAWL_LIMITS.maxRedirectHops) {
        return {
          status: response.status,
          html: null,
          hops,
          redirectFailed: true,
          finalPath: nextPath,
        };
      }
      seen.add(nextPath);
      current = nextPath;
      continue;
    }
    const type = response.headers.get("content-type") ?? "";
    const html = response.ok && type.includes("text/html") ? await response.text() : null;
    if (!html) await response.body?.cancel().catch(() => undefined);
    return { status: response.status, html, hops, redirectFailed: false, finalPath: current };
  }
}

/** Load `/sitemap.xml` (and its child files) into `state.sitemapPaths` and the queue. */
export async function seedFromSitemaps(
  state: SeoCrawlState,
  fetchFn: FetchLike,
  timeoutMs: number,
): Promise<void> {
  state.seeded = true;
  const toPath = (loc: string): string | null => {
    try {
      const u = new URL(loc);
      return u.origin === state.origin ? normalisePath(u.pathname) : null;
    } catch {
      return null;
    }
  };
  const load = async (path: string): Promise<string[]> => {
    try {
      const res = await fetchFn(
        `${state.origin}${path}`,
        requestInit(timeoutMs, "application/xml"),
      );
      if (!res.ok) return [];
      return parseSitemapLocs(await res.text());
    } catch {
      return [];
    }
  };
  const top = await load("/sitemap.xml");
  const files: string[] = [];
  const pages = new Set<string>();
  for (const loc of top) {
    const p = toPath(loc);
    if (!p) continue;
    if (p.endsWith(".xml")) files.push(p);
    else pages.add(p);
  }
  for (const file of files.slice(0, 25)) {
    for (const loc of await load(file)) {
      const p = toPath(loc);
      if (p && !p.endsWith(".xml")) pages.add(p);
    }
  }
  state.sitemapPaths = [...pages];
  const known = new Set([...state.visited, ...state.queue]);
  for (const p of pages) {
    if (!known.has(p) && isCrawlablePath(p)) state.queue.push(p);
  }
}

/**
 * Crawl until the queue is empty, the page ceiling is reached or the budget is spent. Mutates
 * and returns `state`; page-level findings are returned for storage.
 */
export async function runCrawlSegment(
  state: SeoCrawlState,
  options: CrawlOptions = {},
): Promise<CrawlSegmentResult> {
  const fetchFn = options.fetch ?? ((url, init) => fetch(url, init));
  const now = options.now ?? (() => Date.now());
  const budgetMs = options.budgetMs ?? 45_000;
  const maxPages = options.maxPages ?? CRAWL_LIMITS.maxPages;
  const concurrency = options.concurrency ?? CRAWL_LIMITS.concurrency;
  const timeoutMs = options.requestTimeoutMs ?? 15_000;
  const started = now();
  const findings: Finding[] = [];
  const visited = new Set(state.visited);
  const queued = new Set(state.queue);
  let crawled = 0;
  let active = 0;

  if (!state.seeded) await seedFromSitemaps(state, fetchFn, timeoutMs);

  const overBudget = () => now() - started >= budgetMs;

  const crawlOne = async (path: string): Promise<void> => {
    const fetched = await fetchPage(state.origin, path, fetchFn, timeoutMs);
    const parsed = fetched.html ? parsePage(fetched.html, state.origin, path) : null;
    let citability: CitabilityResult | null = null;
    if (parsed && fetched.html && options.scoreCitability) {
      try {
        citability = await options.scoreCitability(fetched.html, path);
      } catch {
        citability = null;
      }
    }
    const record: SeoCrawlPageRecord = {
      status: fetched.status,
      html: parsed !== null,
      title: parsed?.title ?? null,
      description: parsed?.description ?? null,
      links: parsed?.links ?? [],
      noindex: parsed?.noindex ?? false,
      words: parsed?.words ?? 0,
      citability: citability?.score ?? null,
    };
    if (fetched.hops.length > 0 && !fetched.redirectFailed) record.redirectedTo = fetched.finalPath;
    state.pages[path] = record;
    findings.push(
      ...pageFindings({
        path,
        origin: state.origin,
        status: fetched.status,
        hops: fetched.hops,
        redirectFailed: fetched.redirectFailed,
        parsed,
        citability,
      }),
    );
    crawled += 1;
    for (const link of record.links) {
      if (visited.has(link) || queued.has(link) || !isCrawlablePath(link)) continue;
      if (visited.size + state.queue.length >= maxPages) break;
      queued.add(link);
      state.queue.push(link);
    }
  };

  const worker = async (): Promise<void> => {
    for (;;) {
      if (overBudget() || visited.size >= maxPages) return;
      const path = state.queue.shift();
      if (path === undefined) {
        if (active === 0) return;
        await sleep(25);
        continue;
      }
      queued.delete(path);
      if (visited.has(path)) continue;
      visited.add(path);
      active += 1;
      try {
        await crawlOne(path);
      } finally {
        active -= 1;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

  state.visited = [...visited];
  const done = state.queue.length === 0 || visited.size >= maxPages;
  return { state, findings: withFixes(findings), crawled, done, elapsedMs: now() - started };
}
