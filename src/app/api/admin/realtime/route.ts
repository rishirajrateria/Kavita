/**
 * `GET /api/admin/realtime` — the last five minutes of raw activity for the realtime panel's
 * polling fallback. Viewer role suffices (read-only). `connected: false` without a database.
 */
import { getRealtime, isAnalyticsConfigured } from "@/lib/analytics/queries";
import { adminRoute } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export const GET = adminRoute(
  async () => {
    const connected = isAnalyticsConfigured();
    const snapshot = await getRealtime();
    return { connected, ...snapshot };
  },
  { role: "viewer", requireDatabase: false },
);
