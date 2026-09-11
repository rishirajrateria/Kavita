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

/**
 * Every `page_answers` row for one route, keyed by `h2Id`. Takes the db explicitly so the
 * tests can run it against PGlite; the app goes through `getPageAnswers`.
 */
export async function readPageAnswers(
  db: Db | null,
  route: string,
): Promise<Record<string, PageAnswer>> {
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
}

/**
 * All answer rows for a route, keyed by `h2Id`. ONE query per route per request — every
 * answer block and the key-facts band on a page share this memoised read, and with no
 * database configured it returns `{}` before any connection is attempted, so static
 * generation never waits on Supabase.
 */
export const getPageAnswers = cache(
  async (route: string): Promise<Record<string, PageAnswer>> => readPageAnswers(getDb(), route),
);

/** The route's answer overrides as `h2Id → answer`, blank rows dropped. Memoised per request. */
export const getAnswerOverridesForRoute = cache(
  async (route: string): Promise<Record<string, string>> => answerMap(await getPageAnswers(route)),
);

/** `h2Id → answer` for the non-empty rows of a `readPageAnswers` result. Pure. */
export function answerMap(rows: Record<string, PageAnswer>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [h2Id, row] of Object.entries(rows)) {
    const answer = row.answer?.trim();
    if (answer && h2Id !== KEY_FACTS_ID) out[h2Id] = answer;
  }
  return out;
}

/** The override for `h2Id`, or the page's own copy. Pure — the components' single decision. */
export function pickAnswer(
  overrides: Record<string, string>,
  h2Id: string | undefined,
  fallback: string,
): string {
  if (!h2Id) return fallback;
  return overrides[h2Id] ?? fallback;
}

/**
 * The page's key facts with the admin's override applied: a fact whose label matches replaces
 * the page's value in place, and any further fact is appended. Pure.
 */
export function mergeKeyFacts<T extends KeyFact>(items: T[], override: KeyFact[]): (T | KeyFact)[] {
  if (override.length === 0) return items;
  const by = new Map(override.map((f) => [f.label.trim().toLowerCase(), f]));
  const merged: (T | KeyFact)[] = items.map((item) => {
    const hit = by.get(item.label.trim().toLowerCase());
    if (!hit) return item;
    by.delete(item.label.trim().toLowerCase());
    return { ...item, value: hit.value };
  });
  for (const fact of override) {
    if (by.has(fact.label.trim().toLowerCase())) merged.push(fact);
  }
  return merged;
}

/** Override for one answer block, or `null` to keep the page's own copy. */
export async function getAnswerOverride(route: string, h2Id: string): Promise<string | null> {
  const rows = await getPageAnswers(route);
  const answer = rows[h2Id]?.answer?.trim();
  return answer ? answer : null;
}

/** Key facts the admin has saved for a page's key-facts band, or `[]`. */
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
