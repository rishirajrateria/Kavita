/**
 * FAQs by route. Server-only; DB when configured, seed otherwise.
 */
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { faqs } from "@/db/schema";
import { SEED_NS, faqsSeed, hydrate } from "@/content/seed";
import type { Faq } from "./types";

/** Stable seed id key for an FAQ: route + sort order (question text may be edited). */
export const faqSeedKey = (f: { routePattern: string | null; sortOrder: number }) =>
  `${f.routePattern ?? ""}#${f.sortOrder}`;

/** Published FAQs whose `routePattern` equals `route`, sorted by `sortOrder`. */
export const getFaqsForRoute = cache(async (route: string): Promise<Faq[]> => {
  const db = getDb();
  if (db) {
    return db.query.faqs.findMany({
      where: and(eq(faqs.routePattern, route), eq(faqs.isPublished, true)),
      orderBy: [asc(faqs.sortOrder)],
    });
  }
  return faqsSeed
    .filter((f) => f.routePattern === route && f.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => hydrate<Faq>(SEED_NS.faqs, faqSeedKey(f), f));
});
