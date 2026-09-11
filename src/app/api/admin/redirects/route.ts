/**
 * `GET /api/admin/redirects` — every rule (viewer+). `POST` — create one (editor+): validated,
 * loop-refused, chain-collapsed when asked; a rule created from the 404 log marks that path
 * resolved. Every write audits, invalidates the cache and pings the refresh endpoint.
 */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { markNotFoundResolved } from "@/lib/redirects/not-found-log";
import { afterRedirectWrite } from "@/lib/redirects/refresh";
import {
  createRedirect,
  listRedirects,
  redirectInputSchema,
  RedirectSaveError,
} from "@/lib/redirects/store";
import { submitIndexNowLogged } from "@/lib/redirects/indexnow-log";

export const dynamic = "force-dynamic";

export const GET = adminRoute(
  async () => {
    const db = getDb();
    if (!db) return { redirects: [] };
    return { redirects: await listRedirects(db) };
  },
  { role: "viewer", requireDatabase: false },
);

export const POST = adminRoute(
  async ({ data, request, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    try {
      const { redirect, check } = await createRedirect(db, data);
      if (data.source === "not_found_fix") await markNotFoundResolved(redirect.fromPath);
      await audit({
        action: "redirects.create",
        entityType: "redirects",
        entityId: redirect.id,
        after: redirect,
      });
      afterRedirectWrite(request);
      if (
        redirect.isActive &&
        redirect.matchType === "exact" &&
        redirect.statusCode !== 410 &&
        redirect.toPath
      ) {
        void submitIndexNowLogged([redirect.fromPath, redirect.toPath], "redirect").catch(
          () => undefined,
        );
      }
      return { redirect, chain: check.chain, collapsedTo: check.finalDestination };
    } catch (error) {
      if (error instanceof RedirectSaveError) {
        throw new AdminRouteError(
          error.reason === "duplicate" ? "conflict" : "validation",
          error.message,
          {
            errors: { fromPath: [error.message] },
          },
        );
      }
      throw error;
    }
  },
  { role: "editor", schema: redirectInputSchema },
);
