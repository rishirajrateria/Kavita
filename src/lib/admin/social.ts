/**
 * Social-links management (CLAUDE.md §13.A). Reads every row including hidden ones (the public
 * `getSocialLinks()` only returns visible links); writes return `{ before, after }` for the
 * audit log. Without a database the seed rows are shown read-only.
 */
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { socialLinks, type SocialLink } from "@/db/schema";
import { SEED_NS, hydrate, socialLinksSeed } from "@/content/seed";
import type { BookingDb } from "@/lib/booking/db";
import type { socialLinkSchema, socialLinkUpdateSchema } from "./manage-schemas";
import { sameAsPreview } from "./social-validators";

export type ManageDb = BookingDb;

export async function listAllSocialLinks(db: ManageDb | null): Promise<SocialLink[]> {
  if (!db) {
    return socialLinksSeed
      .map((l) => hydrate<SocialLink>(SEED_NS.socialLinks, l.url, l))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return db
    .select()
    .from(socialLinks)
    .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.createdAt));
}

export async function createSocialLink(
  db: ManageDb,
  input: z.output<typeof socialLinkSchema>,
): Promise<{ ok: true; link: SocialLink } | { ok: false; reason: "duplicate_url" }> {
  const [existing] = await db
    .select({ id: socialLinks.id })
    .from(socialLinks)
    .where(eq(socialLinks.url, input.url));
  if (existing) return { ok: false, reason: "duplicate_url" };
  const [max] = await db
    .select({ m: sql<number>`coalesce(max(${socialLinks.sortOrder}), 0)` })
    .from(socialLinks);
  const [link] = await db
    .insert(socialLinks)
    .values({ ...input, sortOrder: input.sortOrder || Number(max?.m ?? 0) + 10 })
    .returning();
  if (!link) throw new Error("social link insert returned nothing");
  return { ok: true, link };
}

export async function updateSocialLink(
  db: ManageDb,
  id: string,
  input: Partial<z.output<typeof socialLinkUpdateSchema>>,
): Promise<
  | { ok: true; before: SocialLink; after: SocialLink }
  | { ok: false; reason: "not_found" | "duplicate_url" }
> {
  const [before] = await db.select().from(socialLinks).where(eq(socialLinks.id, id));
  if (!before) return { ok: false, reason: "not_found" };
  if (input.url && input.url !== before.url) {
    const [dup] = await db
      .select({ id: socialLinks.id })
      .from(socialLinks)
      .where(eq(socialLinks.url, input.url));
    if (dup) return { ok: false, reason: "duplicate_url" };
  }
  const set = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<SocialLink>;
  const [after] = await db.update(socialLinks).set(set).where(eq(socialLinks.id, id)).returning();
  if (!after) return { ok: false, reason: "not_found" };
  return { ok: true, before, after };
}

export async function deleteSocialLink(db: ManageDb, id: string): Promise<SocialLink | null> {
  const [row] = await db.delete(socialLinks).where(eq(socialLinks.id, id)).returning();
  return row ?? null;
}

/** Persist a new order: `ids` in display order become sort_order 10, 20, 30 … */
export async function reorderSocialLinks(
  db: ManageDb,
  ids: string[],
): Promise<{ before: SocialLink[]; after: SocialLink[] }> {
  const before = await db.select().from(socialLinks).where(inArray(socialLinks.id, ids));
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) {
      await tx
        .update(socialLinks)
        .set({ sortOrder: (i + 1) * 10 })
        .where(eq(socialLinks.id, id));
    }
  });
  const after = await db
    .select()
    .from(socialLinks)
    .where(inArray(socialLinks.id, ids))
    .orderBy(asc(socialLinks.sortOrder));
  return { before, after };
}

/** What the footer and the schema `sameAs` array would show for these rows. */
export function previewFor(links: readonly SocialLink[]) {
  const visible = [...links].filter((l) => l.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    footer: visible.filter((l) => l.showInFooter),
    header: visible.filter((l) => l.showInHeader),
    sameAs: sameAsPreview(links),
  };
}
