/** `POST /api/admin/aeo/answers` — upsert an answer-block / key-facts override (editor+). */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { pageAnswerSchema } from "@/lib/seo/admin-schemas";
import { lintAnswer } from "@/lib/seo/aeo";
import { upsertPageAnswer } from "@/lib/seo/aeo-data";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const lint = data.answer ? lintAnswer(data.answer) : null;
    const { before, after } = await upsertPageAnswer(db, data);
    await audit({
      action: before ? "page_answers.update" : "page_answers.create",
      entityType: "page_answers",
      entityId: after?.id ?? null,
      before,
      after,
    });
    return { row: after, lint };
  },
  { role: "editor", schema: pageAnswerSchema },
);
