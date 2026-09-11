/**
 * Sitemap control (Phase 6, P6-B): `sitemap_config` rows switch whole sections on or off and
 * override individual pages (exclude, priority, changefreq). `src/lib/sitemaps.ts` applies
 * them through `applySitemapConfig()`; the admin page edits them. No database → defaults
 * (every section included, no overrides), so the Phase 2 behaviour is unchanged offline.
 */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sitemapConfig, type SitemapPageOverride } from "@/db/schema/redirects";
import type { RedirectDb } from "./store";

export const SITEMAP_SECTIONS = [
  { key: "pages", file: "/sitemap-pages.xml", label: "Core pages" },
  { key: "geo-astrology", file: "/sitemap-geo-astrology.xml", label: "Geo — astrologer" },
  { key: "geo-vastu", file: "/sitemap-geo-vastu.xml", label: "Geo — vastu consultant" },
  { key: "learn", file: "/sitemap-learn.xml", label: "Learn & glossary" },
  { key: "images", file: "/sitemap-images.xml", label: "Images" },
] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number]["key"];

export interface SectionConfig {
  included: boolean;
  perPage: Record<string, SitemapPageOverride>;
}
export type SitemapConfigMap = Record<SitemapSection, SectionConfig>;

export function defaultSitemapConfig(): SitemapConfigMap {
  const out = {} as SitemapConfigMap;
  for (const s of SITEMAP_SECTIONS) out[s.key] = { included: true, perPage: {} };
  return out;
}

export function isSitemapSection(value: string): value is SitemapSection {
  return SITEMAP_SECTIONS.some((s) => s.key === value);
}

let cached: { at: number; config: SitemapConfigMap } | null = null;
const TTL_MS = 60_000;

export async function getSitemapConfig(db: RedirectDb | null = getDb()): Promise<SitemapConfigMap> {
  const config = defaultSitemapConfig();
  if (!db) return config;
  if (cached && Date.now() - cached.at < TTL_MS && db === getDb()) return cached.config;
  try {
    const rows = await db.select().from(sitemapConfig);
    for (const row of rows) {
      if (isSitemapSection(row.section)) {
        config[row.section] = { included: row.included, perPage: row.perPage ?? {} };
      }
    }
  } catch {
    return config;
  }
  if (db === getDb()) cached = { at: Date.now(), config };
  return config;
}

export function invalidateSitemapConfigCache(): void {
  cached = null;
}

export async function saveSitemapSection(
  db: RedirectDb,
  section: SitemapSection,
  patch: Partial<SectionConfig>,
): Promise<SectionConfig> {
  const current = (await getSitemapConfig(db))[section];
  const next: SectionConfig = {
    included: patch.included ?? current.included,
    perPage: patch.perPage ?? current.perPage,
  };
  await db
    .insert(sitemapConfig)
    .values({ section, included: next.included, perPage: next.perPage })
    .onConflictDoUpdate({
      target: sitemapConfig.section,
      set: { included: next.included, perPage: next.perPage },
    });
  invalidateSitemapConfigCache();
  return next;
}

/** Set or clear one page's override inside a section. */
export async function setPageOverride(
  db: RedirectDb,
  section: SitemapSection,
  path: string,
  override: SitemapPageOverride | null,
): Promise<SectionConfig> {
  const current = (await getSitemapConfig(db))[section];
  const perPage = { ...current.perPage };
  if (override === null) delete perPage[path];
  else perPage[path] = override;
  return saveSitemapSection(db, section, { perPage });
}

export async function deleteSitemapSection(db: RedirectDb, section: SitemapSection): Promise<void> {
  await db.delete(sitemapConfig).where(eq(sitemapConfig.section, section));
  invalidateSitemapConfigCache();
}

/** Site-relative key for a sitemap `loc` (`https://site/about` → `/about`, home → `/`). */
export function locToPath(loc: string): string {
  try {
    const url = new URL(loc);
    const path = url.pathname.replace(/\/+$/, "");
    return path || "/";
  } catch {
    return loc;
  }
}

/** Pure: drop excluded pages and apply priority/changefreq overrides for one section. */
export function applyPageOverrides<
  T extends { loc: string; priority?: number; changefreq?: string },
>(entries: readonly T[], section: SectionConfig): T[] {
  if (!section.included) return [];
  const keys = Object.keys(section.perPage);
  if (keys.length === 0) return [...entries];
  const out: T[] = [];
  for (const entry of entries) {
    const o = section.perPage[locToPath(entry.loc)];
    if (!o) {
      out.push(entry);
      continue;
    }
    if (o.included === false) continue;
    const next: { loc: string; priority?: number; changefreq?: string } = { ...entry };
    if (o.priority !== undefined) next.priority = o.priority;
    if (o.changeFrequency) next.changefreq = o.changeFrequency;
    out.push(next as T);
  }
  return out;
}
