/**
 * Helpers shared by the seed content, the seed script and the no-database fallback.
 *
 * `SeedRow<T>` is a fully-explicit row (every column except id/created_at/updated_at). It is
 * assignable to the table's `$inferInsert`, and hydrating it with `stableId()` and the seed
 * timestamp yields a complete `$inferSelect` row — so page code sees the same shape whether the
 * data came from Postgres or from these files.
 */
import { createHash } from "node:crypto";

export type SeedRow<TSelect> = Omit<TSelect, "id" | "createdAt" | "updatedAt">;

/** `stableId` namespaces per seeded table, shared by the seed script and the fallback. */
export const SEED_NS = {
  siteSettings: "site_settings",
  socialLinks: "social_links",
  integrations: "integrations",
  services: "services",
  locations: "locations",
  faqs: "faqs",
} as const;

/** Marker every unfilled client value carries. Tracked in NEEDS-REAL-DATA.md. */
export const PLACEHOLDER_PATTERN = /\{\{[^}]*\}\}/;

/**
 * Deterministic UUID (v5-style, SHA-1 in the DNS-agnostic "astrologer-kavita" namespace) so a
 * seed record has the same id in the database and in the fallback, and re-seeding upserts.
 */
export function stableId(namespace: string, key: string): string {
  const hex = createHash("sha1").update(`astrologer-kavita:${namespace}:${key}`).digest("hex");
  const v = hex.slice(0, 32).split("");
  v[12] = "5";
  v[16] = ((parseInt(v[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
  const s = v.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

/** Date the seed content was last edited by hand. Update when editing any seed file; it is the
 *  `created_at`/`updated_at` of fallback rows and must never be `new Date()`. */
export const SEED_CONTENT_UPDATED_AT = new Date("2026-09-10T00:00:00Z");

export function hydrate<TSelect extends { id: string; createdAt: Date; updatedAt: Date }>(
  namespace: string,
  key: string,
  row: SeedRow<TSelect>,
): TSelect {
  return {
    id: stableId(namespace, key),
    createdAt: SEED_CONTENT_UPDATED_AT,
    updatedAt: SEED_CONTENT_UPDATED_AT,
    ...row,
  } as TSelect;
}
