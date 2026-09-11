/**
 * Automatic 301 on slug change (CLAUDE.md §5: "Slugs are immutable once published. If one
 * must change, a 301 is mandatory"). Called non-optionally by the admin mutation routes that
 * can rename a public URL — today the services editor (`/services/<slug>`). Locations keep an
 * immutable `path` (the research files and base records are keyed by it), and Learn articles
 * and glossary terms are repository-managed, so a rename there is a code change: add the 301
 * in `/admin/redirects` in the same commit.
 *
 * Every call: creates or re-points the exact rule `oldPath → newPath` (source `slug_change`),
 * collapses any rule that pointed at `oldPath` so it goes straight to `newPath`, invalidates
 * the in-process cache and submits both URLs to IndexNow.
 */
import { eq } from "drizzle-orm";
import { redirects } from "@/db/schema/redirects";
import { invalidateRedirectCache } from "./cache";
import { submitIndexNowLogged } from "./indexnow-log";
import { normalisePathname } from "./matchers";
import { collapseIncoming, type RedirectDb } from "./store";

export interface SlugChange {
  /** `services`, `locations`, … — recorded in the rule's note. */
  entity: string;
  oldPath: string;
  newPath: string;
  adminUserId: string | null;
  db: RedirectDb;
  /** Skip the IndexNow ping (tests). */
  submit?: boolean;
}

export interface SlugChangeResult {
  redirectId: string | null;
  collapsed: number;
  /** True when old and new paths were equal and nothing was recorded. */
  unchanged: boolean;
}

export async function recordSlugChange(change: SlugChange): Promise<SlugChangeResult> {
  const oldPath = normalisePathname(change.oldPath);
  const newPath = normalisePathname(change.newPath);
  if (oldPath === newPath) return { redirectId: null, collapsed: 0, unchanged: true };
  const { db } = change;
  const note = `Automatic: ${change.entity} slug changed ${oldPath} → ${newPath}`;

  // A rule for the new path that pointed back at the old one would now loop: drop it.
  await db.delete(redirects).where(eq(redirects.fromPath, newPath));

  const [row] = await db
    .insert(redirects)
    .values({
      fromPath: oldPath,
      toPath: newPath,
      matchType: "exact",
      statusCode: 301,
      isActive: true,
      note,
      source: "slug_change",
    })
    .onConflictDoUpdate({
      target: redirects.fromPath,
      set: {
        toPath: newPath,
        statusCode: 301,
        isActive: true,
        matchType: "exact",
        note,
        source: "slug_change",
      },
    })
    .returning({ id: redirects.id });

  const collapsed = await collapseIncoming(db, oldPath, newPath);
  invalidateRedirectCache();
  if (change.submit !== false) {
    void submitIndexNowLogged([oldPath, newPath], "slug_change", db).catch(() => undefined);
  }
  return { redirectId: row?.id ?? null, collapsed, unchanged: false };
}
