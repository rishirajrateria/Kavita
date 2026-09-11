/**
 * Search-engine verification (CLAUDE.md §13B): meta tags rendered in `<head>` and HTML/XML
 * files served at their public path by `/api/verify` through a proxy rewrite. The file-path
 * allow-list is deliberately narrow — only the names the engines actually hand out — so the
 * admin can never publish an arbitrary file at the site root.
 */
import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { cache } from "react";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import { verificationTags, type VerificationTag } from "@/db/schema";
import { VERIFICATION_FILE_PATTERN, contentTypeFor } from "./verification-paths";

export type VerificationDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Public paths a verification file may take — defined in `./verification-paths` (proxy-safe). */
export {
  VERIFICATION_FILE_PATTERN,
  VERIFY_PATH_HEADER,
  contentTypeFor,
} from "./verification-paths";

export const VERIFICATION_META_NAMES = [
  "google-site-verification",
  "msvalidate.01",
  "p:domain_verify",
  "yandex-verification",
  "facebook-domain-verification",
  "ahrefs-site-verification",
] as const;

export const VERIFICATION_PROVIDERS = [
  "google",
  "bing",
  "pinterest",
  "yandex",
  "facebook",
  "other",
] as const;

export function validateMetaName(value: string): string | null {
  return /^[a-z0-9_.:-]{2,64}$/i.test(value.trim())
    ? null
    : "Meta name may contain letters, digits, dots, colons, hyphens and underscores.";
}

export function validateMetaContent(value: string): string | null {
  return /^[A-Za-z0-9_=+/.\-:]{4,256}$/.test(value.trim())
    ? null
    : "Paste only the content value of the verification meta tag.";
}

export function validateFilePath(value: string): string | null {
  const v = value.trim().startsWith("/") ? value.trim() : `/${value.trim()}`;
  return VERIFICATION_FILE_PATTERN.test(v)
    ? null
    : "Allowed file names: google….html, BingSiteAuth.xml, pinterest-….html, yandex_….html.";
}

export function normalizeFilePath(value: string): string {
  const v = value.trim();
  return v.startsWith("/") ? v : `/${v}`;
}

function resolveDb(db?: VerificationDb | null): VerificationDb | null {
  return db === undefined ? getDb() : db;
}

/** Every row (enabled or not), for the admin editor. */
export const listVerificationTags = cache(
  async (db?: VerificationDb | null): Promise<VerificationTag[]> => {
    const database = resolveDb(db);
    if (!database) return [];
    return database.select().from(verificationTags);
  },
);

/** Enabled meta-tag rows — the `<meta>` elements `<Integrations />` hoists into `<head>`. */
export async function enabledVerificationMetas(
  db?: VerificationDb | null,
): Promise<{ name: string; content: string }[]> {
  return (await listVerificationTags(db))
    .filter((t) => t.isEnabled && t.kind === "meta" && t.metaName && t.metaContent)
    .map((t) => ({ name: t.metaName as string, content: t.metaContent as string }));
}

/** The file body for a public path, or `null` when no enabled file row matches. */
export async function getVerificationFile(
  path: string,
  db?: VerificationDb | null,
): Promise<{ body: string; contentType: string } | null> {
  if (!VERIFICATION_FILE_PATTERN.test(path)) return null;
  const database = resolveDb(db);
  if (!database) return null;
  const rows = await database
    .select()
    .from(verificationTags)
    .where(and(eq(verificationTags.kind, "file"), eq(verificationTags.isEnabled, true)));
  const row = rows.find((r) => r.filePath?.toLowerCase() === path.toLowerCase());
  if (!row?.fileContent) return null;
  return { body: row.fileContent, contentType: contentTypeFor(path) };
}

export interface VerificationTagInput {
  provider: string;
  kind: "meta" | "file";
  metaName?: string | null;
  metaContent?: string | null;
  filePath?: string | null;
  fileContent?: string | null;
  isEnabled?: boolean;
}

/** Upsert on (provider, kind). Returns before/after for the audit log. */
export async function setVerificationTag(
  input: VerificationTagInput,
  db?: VerificationDb | null,
): Promise<{ before: VerificationTag | null; after: VerificationTag }> {
  const database = resolveDb(db);
  if (!database) throw new Error("Database unavailable");
  const before =
    (
      await database
        .select()
        .from(verificationTags)
        .where(
          and(eq(verificationTags.provider, input.provider), eq(verificationTags.kind, input.kind)),
        )
    )[0] ?? null;
  const values = {
    provider: input.provider,
    kind: input.kind,
    metaName: input.kind === "meta" ? (input.metaName?.trim() ?? null) : null,
    metaContent: input.kind === "meta" ? (input.metaContent?.trim() ?? null) : null,
    filePath: input.kind === "file" && input.filePath ? normalizeFilePath(input.filePath) : null,
    fileContent: input.kind === "file" ? (input.fileContent ?? null) : null,
    isEnabled: input.isEnabled ?? true,
  };
  const rows = await database
    .insert(verificationTags)
    .values(values)
    .onConflictDoUpdate({ target: [verificationTags.provider, verificationTags.kind], set: values })
    .returning();
  const after = rows[0];
  if (!after) throw new Error("verification_tags upsert returned no row");
  return { before, after };
}

export async function deleteVerificationTag(
  id: string,
  db?: VerificationDb | null,
): Promise<VerificationTag | null> {
  const database = resolveDb(db);
  if (!database) throw new Error("Database unavailable");
  const rows = await database
    .delete(verificationTags)
    .where(eq(verificationTags.id, id))
    .returning();
  return rows[0] ?? null;
}
