/**
 * Persistence for SEO health crawls (Phase 6, P6-D). `DbSeoHealthStore` writes `seo_crawls` /
 * `seo_findings`; `MemorySeoHealthStore` keeps the latest runs in process memory so the
 * dashboard and the run route still work in offline development (no Supabase). Both expose the
 * same interface; `getSeoHealthStore()` picks one from `getDb()`.
 */
import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  seoCrawls,
  seoFindings,
  type SeoCrawlState,
  type SeoCrawlStatus,
  type SeoCrawlSummary,
  type SeoCrawlTrigger,
  type SeoFindingSeverity,
} from "@/db/schema/seo-health";
import type { AuditDb } from "@/lib/admin/audit";
import type { Finding } from "./types";

export type CrawlRow = typeof seoCrawls.$inferSelect;
export type FindingRow = typeof seoFindings.$inferSelect;

export interface CrawlPatch {
  status?: SeoCrawlStatus;
  state?: SeoCrawlState | null;
  pagesCrawled?: number;
  pagesDiscovered?: number;
  elapsedMs?: number;
  finishedAt?: Date | null;
  summary?: SeoCrawlSummary | null;
  error?: string | null;
}

export interface FindingFilter {
  type?: string;
  severity?: SeoFindingSeverity;
  path?: string;
  page?: number;
  pageSize?: number;
}

export interface FindingCounts {
  byType: Record<string, number>;
  bySeverity: Record<SeoFindingSeverity, number>;
  total: number;
}

export interface SeoHealthStore {
  /** `false` for the in-memory store: results vanish on restart. */
  readonly persistent: boolean;
  createCrawl(input: {
    origin: string;
    trigger: SeoCrawlTrigger;
    state: SeoCrawlState;
  }): Promise<CrawlRow>;
  updateCrawl(id: string, patch: CrawlPatch): Promise<void>;
  addFindings(crawlId: string, findings: Finding[]): Promise<void>;
  getCrawl(id: string): Promise<CrawlRow | null>;
  /** The crawl to continue for this origin: paused, or `running` but idle for > 3 minutes. */
  getResumable(origin: string): Promise<CrawlRow | null>;
  getLatest(): Promise<CrawlRow | null>;
  listCrawls(limit?: number): Promise<CrawlRow[]>;
  listFindings(
    crawlId: string,
    filter?: FindingFilter,
  ): Promise<{ rows: FindingRow[]; total: number }>;
  countFindings(crawlId: string): Promise<FindingCounts>;
}

const STALE_MS = 3 * 60_000;
const emptyCounts = (): FindingCounts => ({
  byType: {},
  bySeverity: { error: 0, warning: 0, info: 0 },
  total: 0,
});

function isResumable(row: CrawlRow, now: number): boolean {
  if (row.status === "paused") return true;
  return row.status === "running" && now - row.updatedAt.getTime() > STALE_MS;
}

// --- Database ----------------------------------------------------------------------------------

export class DbSeoHealthStore implements SeoHealthStore {
  readonly persistent = true;
  constructor(private readonly db: AuditDb) {}

  async createCrawl(input: { origin: string; trigger: SeoCrawlTrigger; state: SeoCrawlState }) {
    const [row] = await this.db
      .insert(seoCrawls)
      .values({ origin: input.origin, trigger: input.trigger, state: input.state })
      .returning();
    if (!row) throw new Error("seo_crawls insert returned no row");
    return row;
  }

  async updateCrawl(id: string, patch: CrawlPatch) {
    await this.db
      .update(seoCrawls)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(seoCrawls.id, id));
  }

  async addFindings(crawlId: string, findings: Finding[]) {
    for (let i = 0; i < findings.length; i += 200) {
      const chunk = findings.slice(i, i + 200).map((f) => ({
        crawlId,
        path: f.path,
        type: f.type,
        severity: f.severity,
        message: f.message,
        details: f.details ?? null,
        fixHref: f.fixHref ?? null,
      }));
      if (chunk.length > 0) await this.db.insert(seoFindings).values(chunk);
    }
  }

  async getCrawl(id: string) {
    return (await this.db.query.seoCrawls.findFirst({ where: eq(seoCrawls.id, id) })) ?? null;
  }

  async getResumable(origin: string) {
    const rows = await this.db
      .select()
      .from(seoCrawls)
      .where(eq(seoCrawls.origin, origin))
      .orderBy(desc(seoCrawls.startedAt))
      .limit(5);
    const now = Date.now();
    return rows.find((r) => isResumable(r, now)) ?? null;
  }

  async getLatest() {
    const rows = await this.listCrawls(1);
    return rows[0] ?? null;
  }

  async listCrawls(limit = 20) {
    return this.db
      .select({
        id: seoCrawls.id,
        status: seoCrawls.status,
        trigger: seoCrawls.trigger,
        origin: seoCrawls.origin,
        startedAt: seoCrawls.startedAt,
        finishedAt: seoCrawls.finishedAt,
        elapsedMs: seoCrawls.elapsedMs,
        pagesCrawled: seoCrawls.pagesCrawled,
        pagesDiscovered: seoCrawls.pagesDiscovered,
        state: sql<null>`null`,
        summary: seoCrawls.summary,
        error: seoCrawls.error,
        createdAt: seoCrawls.createdAt,
        updatedAt: seoCrawls.updatedAt,
      })
      .from(seoCrawls)
      .orderBy(desc(seoCrawls.startedAt))
      .limit(limit);
  }

  async listFindings(crawlId: string, filter: FindingFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filter.pageSize ?? 50));
    const where = and(
      eq(seoFindings.crawlId, crawlId),
      filter.type ? eq(seoFindings.type, filter.type) : undefined,
      filter.severity ? eq(seoFindings.severity, filter.severity) : undefined,
      filter.path ? eq(seoFindings.path, filter.path) : undefined,
    );
    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(seoFindings)
        .where(where)
        .orderBy(seoFindings.severity, seoFindings.type, seoFindings.path)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ n: count() }).from(seoFindings).where(where),
    ]);
    return { rows, total: totals[0]?.n ?? 0 };
  }

  async countFindings(crawlId: string) {
    const rows = await this.db
      .select({ type: seoFindings.type, severity: seoFindings.severity, n: count() })
      .from(seoFindings)
      .where(eq(seoFindings.crawlId, crawlId))
      .groupBy(seoFindings.type, seoFindings.severity);
    const out = emptyCounts();
    for (const r of rows) {
      out.byType[r.type] = (out.byType[r.type] ?? 0) + r.n;
      out.bySeverity[r.severity] += r.n;
      out.total += r.n;
    }
    return out;
  }
}

// --- In-memory (offline development) --------------------------------------------------------------

/**
 * Held on `globalThis` so the crawl the run route stores is the crawl the dashboard reads: in
 * development the route handlers and the pages are separate module graphs, and a plain
 * module-level object would give each of them its own empty store.
 */
const memoryStoreKey = Symbol.for("astrologerkavita.seoHealthMemoryStore");
type MemoryStore = { crawls: Map<string, CrawlRow>; findings: Map<string, FindingRow[]> };
const globalMemory = globalThis as typeof globalThis & { [memoryStoreKey]?: MemoryStore };
const memory: MemoryStore = (globalMemory[memoryStoreKey] ??= {
  crawls: new Map<string, CrawlRow>(),
  findings: new Map<string, FindingRow[]>(),
});

export class MemorySeoHealthStore implements SeoHealthStore {
  readonly persistent = false;

  async createCrawl(input: { origin: string; trigger: SeoCrawlTrigger; state: SeoCrawlState }) {
    const now = new Date();
    const row: CrawlRow = {
      id: crypto.randomUUID(),
      status: "running",
      trigger: input.trigger,
      origin: input.origin,
      startedAt: now,
      finishedAt: null,
      elapsedMs: 0,
      pagesCrawled: 0,
      pagesDiscovered: 0,
      state: input.state,
      summary: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    memory.crawls.set(row.id, row);
    memory.findings.set(row.id, []);
    // Keep the last five runs only.
    const ids = [...memory.crawls.values()]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(5)
      .map((r) => r.id);
    for (const id of ids) {
      memory.crawls.delete(id);
      memory.findings.delete(id);
    }
    return row;
  }

  async updateCrawl(id: string, patch: CrawlPatch) {
    const row = memory.crawls.get(id);
    if (row) Object.assign(row, patch, { updatedAt: new Date() });
  }

  async addFindings(crawlId: string, findings: Finding[]) {
    const list = memory.findings.get(crawlId);
    if (!list) return;
    const now = new Date();
    for (const f of findings) {
      list.push({
        id: crypto.randomUUID(),
        crawlId,
        path: f.path,
        type: f.type,
        severity: f.severity,
        message: f.message,
        details: f.details ?? null,
        fixHref: f.fixHref ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async getCrawl(id: string) {
    return memory.crawls.get(id) ?? null;
  }

  async getResumable(origin: string) {
    const now = Date.now();
    return (
      (await this.listCrawls(5)).find((r) => r.origin === origin && isResumable(r, now)) ?? null
    );
  }

  async getLatest() {
    return (await this.listCrawls(1))[0] ?? null;
  }

  async listCrawls(limit = 20) {
    return [...memory.crawls.values()]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  async listFindings(crawlId: string, filter: FindingFilter = {}) {
    const order: Record<SeoFindingSeverity, number> = { error: 0, warning: 1, info: 2 };
    const all = (memory.findings.get(crawlId) ?? [])
      .filter((f) => !filter.type || f.type === filter.type)
      .filter((f) => !filter.severity || f.severity === filter.severity)
      .filter((f) => !filter.path || f.path === filter.path)
      .sort(
        (a, b) =>
          order[a.severity] - order[b.severity] ||
          a.type.localeCompare(b.type) ||
          a.path.localeCompare(b.path),
      );
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filter.pageSize ?? 50));
    return { rows: all.slice((page - 1) * pageSize, page * pageSize), total: all.length };
  }

  async countFindings(crawlId: string) {
    const out = emptyCounts();
    for (const f of memory.findings.get(crawlId) ?? []) {
      out.byType[f.type] = (out.byType[f.type] ?? 0) + 1;
      out.bySeverity[f.severity] += 1;
      out.total += 1;
    }
    return out;
  }
}

let memoryStore: MemorySeoHealthStore | undefined;

/** The database store when Supabase is connected, else the process-memory store. */
export function getSeoHealthStore(db: AuditDb | null = getDb()): SeoHealthStore {
  if (db) return new DbSeoHealthStore(db);
  memoryStore ??= new MemorySeoHealthStore();
  return memoryStore;
}
