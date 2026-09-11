/**
 * Orchestrates one budgeted crawl segment against the store (Phase 6, P6-D): resumes a paused
 * (or stale) crawl for the origin or starts a new one, runs `runCrawlSegment()`, persists the
 * page findings and the cursor, and on completion adds the cross-page findings and the summary.
 * Used by `POST /api/admin/seo-health/run` and `GET /api/cron/seo-health`.
 */
import type { SeoCrawlSummary, SeoCrawlTrigger } from "@/db/schema/seo-health";
import { crossPageFindings } from "./checks";
import { createCrawlState, runCrawlSegment, type CrawlOptions } from "./crawl";
import { withFixes } from "./fix-links";
import type { SeoHealthStore } from "./store";

export interface RunSeoHealthInput extends CrawlOptions {
  store: SeoHealthStore;
  origin: string;
  trigger: SeoCrawlTrigger;
  /** Start a new crawl even when a paused one exists. */
  fresh?: boolean;
}

export interface RunSeoHealthResult {
  crawlId: string;
  status: "completed" | "paused" | "failed" | "busy";
  resumed: boolean;
  pagesCrawled: number;
  pagesDiscovered: number;
  /** Findings stored in this segment (page-level plus cross-page when completed). */
  findingsAdded: number;
  summary?: SeoCrawlSummary;
  persistent: boolean;
}

const BUSY_MS = 3 * 60_000;

export async function runSeoHealth(input: RunSeoHealthInput): Promise<RunSeoHealthResult> {
  const origin = new URL(input.origin).origin;
  const { store } = input;

  // A crawl that is actively running in another request must not be run twice.
  const latest = await store.getLatest();
  if (
    latest &&
    latest.origin === origin &&
    latest.status === "running" &&
    Date.now() - latest.updatedAt.getTime() < BUSY_MS
  ) {
    return {
      crawlId: latest.id,
      status: "busy",
      resumed: false,
      pagesCrawled: latest.pagesCrawled,
      pagesDiscovered: latest.pagesDiscovered,
      findingsAdded: 0,
      persistent: store.persistent,
    };
  }

  const resumable = input.fresh ? null : await store.getResumable(origin);
  const state = resumable?.state ?? createCrawlState(origin);
  const crawl = resumable ?? (await store.createCrawl({ origin, trigger: input.trigger, state }));
  const resumed = Boolean(resumable);
  const priorElapsed = resumable?.elapsedMs ?? 0;
  await store.updateCrawl(crawl.id, { status: "running", error: null });

  try {
    const segment = await runCrawlSegment(state, input);
    await store.addFindings(crawl.id, segment.findings);
    let added = segment.findings.length;
    const pagesCrawled = state.visited.length;
    const pagesDiscovered = state.visited.length + state.queue.length;

    if (!segment.done) {
      await store.updateCrawl(crawl.id, {
        status: "paused",
        state,
        pagesCrawled,
        pagesDiscovered,
        elapsedMs: priorElapsed + segment.elapsedMs,
      });
      return {
        crawlId: crawl.id,
        status: "paused",
        resumed,
        pagesCrawled,
        pagesDiscovered,
        findingsAdded: added,
        persistent: store.persistent,
      };
    }

    const cross = withFixes(crossPageFindings(state));
    await store.addFindings(crawl.id, cross);
    added += cross.length;
    const counts = await store.countFindings(crawl.id);
    const scores = Object.values(state.pages)
      .map((p) => p.citability)
      .filter((s): s is number => typeof s === "number");
    const summary: SeoCrawlSummary = {
      byType: counts.byType,
      bySeverity: counts.bySeverity,
      pages: pagesCrawled,
      citabilityAverage:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : undefined,
    };
    await store.updateCrawl(crawl.id, {
      status: "completed",
      state: null,
      pagesCrawled,
      pagesDiscovered,
      elapsedMs: priorElapsed + segment.elapsedMs,
      finishedAt: new Date(),
      summary,
    });
    return {
      crawlId: crawl.id,
      status: "completed",
      resumed,
      pagesCrawled,
      pagesDiscovered,
      findingsAdded: added,
      summary,
      persistent: store.persistent,
    };
  } catch (error) {
    await store.updateCrawl(crawl.id, {
      status: "failed",
      state,
      error: error instanceof Error ? error.message.slice(0, 500) : "crawl failed",
      finishedAt: new Date(),
    });
    return {
      crawlId: crawl.id,
      status: "failed",
      resumed,
      pagesCrawled: state.visited.length,
      pagesDiscovered: state.visited.length + state.queue.length,
      findingsAdded: 0,
      persistent: store.persistent,
    };
  }
}
