/**
 * The single `consent_config` row (banner copy, policy version, consent regions), with the
 * honest default the site ships with. Server-only by construction (`@/db`).
 */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { cache } from "react";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import { consentConfig } from "@/db/schema/integrations";
import { DEFAULT_CONSENT_REGIONS } from "./regions";

export type ConsentDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface ConsentConfigValue {
  policyVersion: string;
  title: string;
  body: string;
  acceptLabel: string;
  rejectLabel: string;
  consentRegions: string[];
  unknownRegionRequiresConsent: boolean;
  updatedAt: Date | null;
}

/** Plain, non-dark-pattern copy; equal-weight Accept / Reject. */
export const DEFAULT_CONSENT_CONFIG: ConsentConfigValue = {
  policyVersion: "2026-09",
  title: "Advertising cookies",
  body: "This site's own visitor statistics are cookieless and always on. Separately, we use advertising tags from third parties (for example Meta and Google) to measure whether our adverts lead to bookings. Those tags set cookies and share the page you visited with the advertising platform. Accept or reject — the site works the same either way, and you can change your mind any time from the “Manage consent” link in the footer.",
  acceptLabel: "Accept advertising cookies",
  rejectLabel: "Reject",
  consentRegions: [...DEFAULT_CONSENT_REGIONS],
  unknownRegionRequiresConsent: true,
  updatedAt: null,
};

function resolveDb(db?: ConsentDb | null): ConsentDb | null {
  return db === undefined ? getDb() : db;
}

/** The current banner configuration — the DB row when present, else the default. */
export const getConsentConfig = cache(
  async (db?: ConsentDb | null): Promise<ConsentConfigValue> => {
    const database = resolveDb(db);
    if (!database) return DEFAULT_CONSENT_CONFIG;
    const row = (await database.select().from(consentConfig).limit(1))[0];
    if (!row) return DEFAULT_CONSENT_CONFIG;
    return {
      policyVersion: row.policyVersion,
      title: row.title,
      body: row.body,
      acceptLabel: row.acceptLabel,
      rejectLabel: row.rejectLabel,
      consentRegions: row.consentRegions,
      unknownRegionRequiresConsent: row.unknownRegionRequiresConsent,
      updatedAt: row.updatedAt,
    };
  },
);

export interface ConsentConfigPatch {
  policyVersion?: string;
  title?: string;
  body?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  consentRegions?: string[];
  unknownRegionRequiresConsent?: boolean;
}

/** Upsert the singleton row. Returns before/after for the audit log. */
export async function setConsentConfig(
  patch: ConsentConfigPatch,
  adminUserId: string | null,
  db?: ConsentDb | null,
): Promise<{ before: ConsentConfigValue; after: ConsentConfigValue }> {
  const database = resolveDb(db);
  if (!database) throw new Error("Database unavailable");
  const before = await getConsentConfig(database);
  const existing = (await database.select().from(consentConfig).limit(1))[0];
  const merged = { ...before, ...stripUndefined(patch), updatedBy: adminUserId };
  const values = {
    policyVersion: merged.policyVersion,
    title: merged.title,
    body: merged.body,
    acceptLabel: merged.acceptLabel,
    rejectLabel: merged.rejectLabel,
    consentRegions: merged.consentRegions,
    unknownRegionRequiresConsent: merged.unknownRegionRequiresConsent,
    updatedBy: adminUserId,
  };
  if (existing) {
    await database.update(consentConfig).set(values);
  } else {
    await database.insert(consentConfig).values(values);
  }
  const row = (await database.select().from(consentConfig).limit(1))[0];
  const after: ConsentConfigValue = row
    ? {
        policyVersion: row.policyVersion,
        title: row.title,
        body: row.body,
        acceptLabel: row.acceptLabel,
        rejectLabel: row.rejectLabel,
        consentRegions: row.consentRegions,
        unknownRegionRequiresConsent: row.unknownRegionRequiresConsent,
        updatedAt: row.updatedAt,
      }
    : before;
  return { before, after };
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
