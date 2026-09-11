/**
 * `site_documents` — admin-edited configuration read at render time (Phase 6 P6-A): the
 * llms.txt composition, the /for-ai additions and the social (OG/Twitter) templates. Each
 * reader is memoised per request and returns `null`/defaults with no database.
 */
import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import type { BookingDb } from "@/lib/booking/db";
import { siteDocuments, type KeyFact, type SiteDocumentKey } from "@/db/schema/seo";

export interface LlmsDocumentConfig {
  /** Replaces the generated blockquote at the top of llms.txt. */
  preamble?: string;
  /** Core routes to leave out of llms.txt / llms-full.txt (paths). */
  excludePaths?: string[];
  /** Extra paths to include (must exist and be indexable). */
  extraPaths?: string[];
  /** Explicit order for the "Key pages" list; unlisted paths follow in registry order. */
  order?: string[];
  /** Include the country geo pages in llms-full.txt (default true). */
  includeCountryGeo?: boolean;
}

export interface ForAiDocumentConfig {
  /** Replaces the generated entity paragraph. */
  intro?: string;
  /** Appended to the key-facts list. */
  extraFacts?: KeyFact[];
  /** Appended to "what the practice does and does not claim". */
  extraLimits?: string[];
  /** Appended to "what to bring". */
  extraBring?: string[];
}

export interface OgTemplate {
  /** `{{title}}`, `{{description}}`, `{{brand}}` tokens. Empty = leave the page's own value. */
  title?: string;
  description?: string;
}

export type OgTemplates = Partial<
  Record<"home" | "geo" | "service" | "article" | "glossary" | "page", OgTemplate>
>;

export const OG_TEMPLATE_TYPES = ["home", "geo", "service", "article", "glossary", "page"] as const;

async function readDocument(key: SiteDocumentKey): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const row = await db.query.siteDocuments.findFirst({ where: eq(siteDocuments.key, key) });
    return row?.config ?? null;
  } catch (error) {
    console.error(
      `[seo] site_documents(${key}) failed:`,
      error instanceof Error ? error.name : error,
    );
    return null;
  }
}

export const getLlmsDocument = cache(
  async (): Promise<LlmsDocumentConfig | null> =>
    (await readDocument("llms")) as LlmsDocumentConfig | null,
);

export const getForAiDocument = cache(
  async (): Promise<ForAiDocumentConfig | null> =>
    (await readDocument("for_ai")) as ForAiDocumentConfig | null,
);

export const getOgTemplates = cache(
  async (): Promise<OgTemplates | null> =>
    (await readDocument("og_templates")) as OgTemplates | null,
);

/** Upsert a document; returns before/after for the audit log. */
export async function saveSiteDocument(
  db: BookingDb,
  key: SiteDocumentKey,
  config: Record<string, unknown>,
  updatedBy: string | null,
) {
  const before =
    (await db.query.siteDocuments.findFirst({ where: eq(siteDocuments.key, key) })) ?? null;
  const [after] = await db
    .insert(siteDocuments)
    .values({ key, config, updatedBy })
    .onConflictDoUpdate({ target: siteDocuments.key, set: { config, updatedBy } })
    .returning();
  return { before, after: after ?? null };
}
