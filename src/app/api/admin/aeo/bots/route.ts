/** `POST /api/admin/aeo/bots` — allow or disallow one AI crawler in robots.txt (owner only). */
import { getDb } from "@/db";
import { robotsBots } from "@/db/schema/seo";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { AI_BOT_GROUPS } from "@/lib/robots-config";
import { robotsBotSchema } from "@/lib/seo/admin-schemas";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const known = AI_BOT_GROUPS.find((b) => b.userAgent.toLowerCase() === data.agent.toLowerCase());
    if (!known)
      throw new AdminRouteError("validation", "Unknown crawler", {
        errors: { agent: ["Not in the §9.7 list"] },
      });
    const before =
      (await db.query.robotsBots.findMany()).find((r) => r.agent === known.userAgent) ?? null;
    const [after] = await db
      .insert(robotsBots)
      .values({ agent: known.userAgent, allow: data.allow, note: data.note })
      .onConflictDoUpdate({ target: robotsBots.agent, set: { allow: data.allow, note: data.note } })
      .returning();
    await audit({
      action: "robots_bots.set",
      entityType: "robots_bots",
      entityId: after?.id ?? null,
      before,
      after,
    });
    return { row: after };
  },
  { role: "owner", schema: robotsBotSchema },
);
