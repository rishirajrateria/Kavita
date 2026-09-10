/**
 * Idempotent seed: upserts every record in `src/content/seed` into Postgres.
 *
 *   pnpm db:seed            (reads SUPABASE_DB_URL from .env via dotenv)
 *
 * Every row has a deterministic id (`stableId`), so re-running updates in place. Placeholder
 * testimonials from `src/content/PLACEHOLDERS.ts` are deliberately NOT seeded.
 */
import "dotenv/config";
import { eq, getTableColumns, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { closeDb, getDb } from "@/db";
import { faqs, integrations, locations, services, siteSettings, socialLinks } from "@/db/schema";
import {
  SEED_NS,
  SITE_SETTINGS_KEY,
  faqsSeed,
  integrationsSeed,
  locationsSeed,
  servicesSeed,
  siteSettingsSeed,
  socialLinksSeed,
  stableId,
} from "@/content/seed";
import { faqSeedKey } from "@/lib/data/faqs";

/** `set: { col: excluded.col }` for every column present in the row, except id/created_at. */
function excludedSet(table: PgTable, row: Record<string, unknown>): Record<string, SQL> {
  const columns = getTableColumns(table);
  const set: Record<string, SQL> = {};
  for (const key of Object.keys(row)) {
    const column = columns[key];
    if (!column || key === "id" || key === "createdAt") continue;
    set[key] = sql.raw(`excluded."${column.name}"`);
  }
  return set;
}

async function main() {
  const db = getDb();
  if (!db) {
    console.error("SUPABASE_DB_URL is not set — nothing to seed. Copy .env.example to .env first.");
    process.exit(1);
  }

  await db.transaction(async (tx) => {
    // site_settings: singleton — update the existing row whatever its id, else insert.
    const existing = await tx.query.siteSettings.findFirst({ columns: { id: true } });
    if (existing) {
      await tx.update(siteSettings).set(siteSettingsSeed).where(eq(siteSettings.id, existing.id));
    } else {
      await tx
        .insert(siteSettings)
        .values({ id: stableId(SEED_NS.siteSettings, SITE_SETTINGS_KEY), ...siteSettingsSeed });
    }
    console.log("site_settings: 1");

    const socialRows = socialLinksSeed.map((r) => ({
      id: stableId(SEED_NS.socialLinks, r.url),
      ...r,
    }));
    await tx
      .insert(socialLinks)
      .values(socialRows)
      .onConflictDoUpdate({
        target: socialLinks.id,
        set: excludedSet(socialLinks, socialRows[0] ?? {}),
      });
    console.log(`social_links: ${socialRows.length}`);

    // integrations: never overwrite config/is_enabled the owner has set — insert missing only.
    const integrationRows = integrationsSeed.map((r) => ({
      id: stableId(SEED_NS.integrations, r.provider),
      ...r,
    }));
    await tx.insert(integrations).values(integrationRows).onConflictDoNothing();
    console.log(`integrations: ${integrationRows.length} (insert-if-missing)`);

    const serviceRows = servicesSeed.map((r) => ({ id: stableId(SEED_NS.services, r.slug), ...r }));
    await tx
      .insert(services)
      .values(serviceRows)
      .onConflictDoUpdate({
        target: services.id,
        set: excludedSet(services, serviceRows[0] ?? {}),
      });
    console.log(`services: ${serviceRows.length}`);

    // locations: parent-first order in the seed satisfies the self-referencing FK. Research
    // fields are never overwritten by the seed once a row exists (Phase 2 fills them in admin).
    let inserted = 0;
    for (const r of locationsSeed) {
      const row = { id: stableId(SEED_NS.locations, r.path), ...r };
      const {
        landmarks: _l,
        tradition: _t,
        climateArchitecture: _c,
        clientConcerns: _cc,
        faqs: _f,
        consultationWindow: _w,
        bodyAstrologyMd: _ba,
        bodyVastuMd: _bv,
        isPublished: _p,
        researchStatus: _rs,
        contentUpdatedAt: _cu,
        ...geographic
      } = row;
      await tx
        .insert(locations)
        .values(row)
        .onConflictDoUpdate({ target: locations.id, set: excludedSet(locations, geographic) });
      inserted += 1;
    }
    console.log(`locations: ${inserted}`);

    const faqRows = faqsSeed.map((r) => ({ id: stableId(SEED_NS.faqs, faqSeedKey(r)), ...r }));
    await tx
      .insert(faqs)
      .values(faqRows)
      .onConflictDoUpdate({ target: faqs.id, set: excludedSet(faqs, faqRows[0] ?? {}) });
    console.log(`faqs: ${faqRows.length}`);
  });
}

main()
  .then(() => closeDb())
  .then(() => {
    console.log("Seed complete.");
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed:", error);
    await closeDb();
    process.exit(1);
  });
