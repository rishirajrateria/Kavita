/**
 * `POST /api/admin/indexnow` — manual IndexNow submission (editor+). Either `urls` (one per
 * line or an array) or `since` (`YYYY-MM-DD`: every sitemap URL whose lastmod is on/after it).
 */
import { z } from "zod";
import { lines } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { submitIndexNowLogged, urlsChangedSince } from "@/lib/redirects/indexnow-log";

export const dynamic = "force-dynamic";

const schema = z.object({
  urls: lines,
  since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const POST = adminRoute(
  async ({ data, audit }) => {
    const urls = data.since ? await urlsChangedSince(data.since) : data.urls;
    if (urls.length === 0) {
      throw new AdminRouteError("validation", "No URLs to submit", {
        errors: { urls: ["nothing to submit"] },
      });
    }
    const result = await submitIndexNowLogged(
      urls,
      data.since ? `manual:since ${data.since}` : "manual",
    );
    await audit({
      action: "indexnow.submit",
      entityType: "indexnow_log",
      after: { urls: result.urls.length, status: result.logStatus, message: result.message },
    });
    return {
      submitted: result.submitted,
      status: result.logStatus,
      message: result.message,
      urls: result.urls,
    };
  },
  { role: "editor", schema, requireDatabase: false },
);
