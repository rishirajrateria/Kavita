/**
 * FAQ attachments (Phase 6 P6-A): one FAQ shown on many routes. `getAttachedFaqs(route)` is
 * the public read (memoised per request, `[]` with no database) that `FaqBlock` appends to a
 * page's own FAQ items; the admin helpers take an explicit `db` and return before/after for
 * the audit log.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import type { BookingDb as Db } from "@/lib/booking/db";
import { faqs } from "@/db/schema/content";
import type { Faq } from "@/db/schema/types";
import { faqAttachments, type FaqAttachment } from "@/db/schema/seo";
import type { FaqItem } from "@/lib/seo/schema";
import { normalisePath } from "@/lib/routes";
import { normalisePattern, patternMatches } from "./route-pattern";

export interface AttachedFaq extends FaqItem {
  faqId: string;
  attachmentId: string;
  routePattern: string;
}

/** Published FAQs attached (directly or by glob) to `route`, ordered, deduplicated by FAQ. */
export const getAttachedFaqs = cache(async (route: string): Promise<AttachedFaq[]> => {
  const db = getDb();
  if (!db) return [];
  const r = normalisePath(route);
  try {
    const rows = await db
      .select({ attachment: faqAttachments, faq: faqs })
      .from(faqAttachments)
      .innerJoin(faqs, eq(faqAttachments.faqId, faqs.id))
      .where(and(eq(faqAttachments.isPublished, true), eq(faqs.isPublished, true)))
      .orderBy(asc(faqAttachments.sortOrder), asc(faqAttachments.createdAt));
    const seen = new Set<string>();
    const out: AttachedFaq[] = [];
    for (const { attachment, faq } of rows) {
      if (!patternMatches(attachment.routePattern, r) || seen.has(faq.id)) continue;
      seen.add(faq.id);
      out.push({
        faqId: faq.id,
        attachmentId: attachment.id,
        routePattern: attachment.routePattern,
        question: faq.question,
        answer: faq.answer,
      });
    }
    return out;
  } catch (error) {
    console.error(
      "[seo] faq_attachments lookup failed:",
      error instanceof Error ? error.name : error,
    );
    return [];
  }
});

// --- admin ------------------------------------------------------------------------------------

export interface AttachmentWithFaq {
  attachment: FaqAttachment;
  faq: Faq;
}

export async function listAttachments(db: Db | null): Promise<AttachmentWithFaq[]> {
  if (!db) return [];
  return db
    .select({ attachment: faqAttachments, faq: faqs })
    .from(faqAttachments)
    .innerJoin(faqs, eq(faqAttachments.faqId, faqs.id))
    .orderBy(asc(faqAttachments.routePattern), asc(faqAttachments.sortOrder));
}

/** Attach many FAQs to one pattern in one go; existing (faq, pattern) pairs are updated. */
export async function bulkAttach(
  db: Db,
  input: { faqIds: string[]; routePattern: string; isPublished: boolean; sortOrderStart?: number },
): Promise<FaqAttachment[]> {
  const pattern = normalisePattern(input.routePattern);
  const existing = await db
    .select({ id: faqs.id })
    .from(faqs)
    .where(inArray(faqs.id, input.faqIds));
  const valid = new Set(existing.map((r) => r.id));
  const start = input.sortOrderStart ?? 0;
  const values = input.faqIds
    .filter((id) => valid.has(id))
    .map((faqId, i) => ({
      faqId,
      routePattern: pattern,
      sortOrder: start + i * 10,
      isPublished: input.isPublished,
    }));
  if (values.length === 0) return [];
  return db
    .insert(faqAttachments)
    .values(values)
    .onConflictDoUpdate({
      target: [faqAttachments.faqId, faqAttachments.routePattern],
      set: { isPublished: input.isPublished },
    })
    .returning();
}

export async function updateAttachment(
  db: Db,
  id: string,
  input: { sortOrder?: number; isPublished?: boolean; routePattern?: string },
): Promise<{ before: FaqAttachment | null; after: FaqAttachment | null }> {
  const before =
    (await db.select().from(faqAttachments).where(eq(faqAttachments.id, id)))[0] ?? null;
  if (!before) return { before: null, after: null };
  const set: Partial<FaqAttachment> = {};
  if (input.sortOrder !== undefined) set.sortOrder = input.sortOrder;
  if (input.isPublished !== undefined) set.isPublished = input.isPublished;
  if (input.routePattern !== undefined) set.routePattern = normalisePattern(input.routePattern);
  const [after] = await db
    .update(faqAttachments)
    .set(set)
    .where(eq(faqAttachments.id, id))
    .returning();
  return { before, after: after ?? null };
}

export async function deleteAttachment(db: Db, id: string): Promise<FaqAttachment | null> {
  return (await db.delete(faqAttachments).where(eq(faqAttachments.id, id)).returning())[0] ?? null;
}
