/**
 * Site settings, social links and integrations. Server-only (never import from a client
 * component). Reads Postgres when `SUPABASE_DB_URL` is set, otherwise the seed content, so
 * SSG works with no database. Every function is wrapped in React `cache()` for per-request
 * de-duplication.
 */
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { integrations, socialLinks } from "@/db/schema";
import {
  SEED_NS,
  SITE_SETTINGS_KEY,
  hydrate,
  integrationsSeed,
  siteSettingsSeed,
  socialLinksSeed,
} from "@/content/seed";
import type { Integration, SiteSettings, SocialLink } from "./types";

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const db = getDb();
  if (db) {
    const row = await db.query.siteSettings.findFirst();
    if (row) return row;
  }
  return hydrate<SiteSettings>(SEED_NS.siteSettings, SITE_SETTINGS_KEY, siteSettingsSeed);
});

/** Visible social links, sorted by `sortOrder`. */
export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const db = getDb();
  if (db) {
    return db.query.socialLinks.findMany({
      where: eq(socialLinks.isVisible, true),
      orderBy: [asc(socialLinks.sortOrder)],
    });
  }
  return socialLinksSeed
    .filter((l) => l.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((l) => hydrate<SocialLink>(SEED_NS.socialLinks, l.url, l));
});

/** URLs for the `sameAs` array of Person / ProfessionalService schema. */
export const getSameAsUrls = cache(async (): Promise<string[]> => {
  const links = await getSocialLinks();
  return links.filter((l) => l.includeInSameas).map((l) => l.url);
});

/** Enabled integrations only — the single input of the `<Integrations />` component. */
export const getIntegrations = cache(async (): Promise<Integration[]> => {
  const db = getDb();
  if (db) {
    return db.query.integrations.findMany({ where: eq(integrations.isEnabled, true) });
  }
  return integrationsSeed
    .filter((i) => i.isEnabled)
    .map((i) => hydrate<Integration>(SEED_NS.integrations, i.provider, i));
});
