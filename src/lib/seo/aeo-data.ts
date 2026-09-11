/**
 * Per-page answer-block and key-facts overrides (`page_answers`; Phase 6 P6-A). Server-only
 * reads memoised per request; admin writes take an explicit `db`. The linter itself lives in
 * `./aeo.ts` so the client island can share it.
 */
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import type { BookingDb as Db } from "@/lib/booking/db";
import { pageAnswers, type KeyFact, type PageAnswer } from "@/db/schema/seo";
import { normalisePath } from "@/lib/routes";

/** The `h2_id` under which a page's key-facts override is stored. */
export const KEY_FACTS_ID = "key-facts";

/** All answer rows for a route, keyed by `h2Id`. */
export const getPageAnswers = cache(async (route: string): Promise<Record<string, PageAnswer>> => {
  const db = getDb();
  if (!db) return {};
  try {
    const rows = await db
      .select()
      .from(pageAnswers)
      .where(eq(pageAnswers.route, normalisePath(route)));
    return Object.fromEntries(rows.map((r) => [r.h2Id, r]));
  } catch (error) {
    console.error("[seo] page_answers lookup failed:", error instanceof Error ? error.name : error);
    return {};
  }
});

/** Override for one answer block, or `null` to keep the page's own copy. */
export async function getAnswerOverride(route: string, h2Id: string): Promise<string | null> {
  const rows = await getPageAnswers(route);
  const answer = rows[h2Id]?.answer?.trim();
  return answer ? answer : null;
}

/** Key facts appended to (or replacing, when `replace`) a page's key-facts block. */
export async function getKeyFactsOverride(route: string): Promise<KeyFact[]> {
  const rows = await getPageAnswers(route);
  return rows[KEY_FACTS_ID]?.keyFacts ?? [];
}

// --- admin ------------------------------------------------------------------------------------

export async function listPageAnswers(db: Db | null): Promise<PageAnswer[]> {
  if (!db) return [];
  return db.select().from(pageAnswers).orderBy(asc(pageAnswers.route), asc(pageAnswers.h2Id));
}

export async function upsertPageAnswer(
  db: Db,
  input: { route: string; h2Id: string; answer?: string; keyFacts?: KeyFact[] | null },
): Promise<{ before: PageAnswer | null; after: PageAnswer | null }> {
  const route = normalisePath(input.route);
  const before =
    (await db.select().from(pageAnswers).where(eq(pageAnswers.route, route))).find(
      (r) => r.h2Id === input.h2Id,
    ) ?? null;
  const values = {
    route,
    h2Id: input.h2Id,
    answer: input.answer ?? before?.answer ?? "",
    keyFacts: input.keyFacts === undefined ? (before?.keyFacts ?? null) : input.keyFacts,
  };
  const [after] = await db
    .insert(pageAnswers)
    .values(values)
    .onConflictDoUpdate({
      target: [pageAnswers.route, pageAnswers.h2Id],
      set: { answer: values.answer, keyFacts: values.keyFacts },
    })
    .returning();
  return { before, after: after ?? null };
}

export async function deletePageAnswer(db: Db, id: string): Promise<PageAnswer | null> {
  return (await db.delete(pageAnswers).where(eq(pageAnswers.id, id)).returning())[0] ?? null;
}
