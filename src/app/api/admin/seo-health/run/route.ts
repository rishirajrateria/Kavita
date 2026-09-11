/**
 * `POST /api/admin/seo-health/run` — run (or continue) an SEO health crawl of this deployment
 * inside the request, with a time budget so the response returns before the platform limit.
 * A paused crawl resumes from its cursor; `fresh: true` starts over. Editor role or higher.
 * Works without Supabase (results are then kept in process memory for the dashboard).
 */
import { z } from "zod";
import { adminRoute } from "@/lib/admin/mutations";
import { internalOrigin } from "@/lib/markdown/fetch-page";
import { scorePageCitability } from "@/lib/seo-health/citability";
import { runSeoHealth } from "@/lib/seo-health/runner";
import { getSeoHealthStore } from "@/lib/seo-health/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_BUDGET_MS = 45_000;

const bodySchema = z.object({
  fresh: z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean()).default(false),
  budgetMs: z.coerce.number().int().min(1_000).max(55_000).optional(),
});

export const POST = adminRoute(
  async ({ request, data, audit }) => {
    const origin = internalOrigin(request.headers);
    const result = await runSeoHealth({
      store: getSeoHealthStore(),
      origin,
      trigger: "manual",
      fresh: data.fresh,
      budgetMs: data.budgetMs ?? DEFAULT_BUDGET_MS,
      scoreCitability: scorePageCitability,
    });
    if (result.status !== "busy") {
      await audit({
        action: `seo_health.${result.resumed ? "resume" : "run"}`,
        entityType: "seo_crawls",
        entityId: result.crawlId,
        after: {
          status: result.status,
          pagesCrawled: result.pagesCrawled,
          findingsAdded: result.findingsAdded,
        },
      });
    }
    return { ...result };
  },
  { role: "editor", schema: bodySchema, requireDatabase: false },
);
