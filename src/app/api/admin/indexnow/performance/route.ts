/** `POST /api/admin/indexnow/performance` — clear the 1 h Search Console / Bing cache (editor+). */
import { adminRoute } from "@/lib/admin/mutations";
import { clearPerformanceCache } from "@/lib/search-console/cache";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ audit }) => {
    await clearPerformanceCache();
    await audit({
      action: "search_performance_cache.clear",
      entityType: "search_performance_cache",
    });
    return { cleared: true };
  },
  { role: "editor" },
);
