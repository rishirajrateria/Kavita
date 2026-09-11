/**
 * Credential store for the `integrations` table (CLAUDE.md §13; Phase 6, P6-C). Server-only by
 * construction (`@/db`, `node:crypto`); no `server-only` marker so the tsx tests can import it.
 *
 *   getIntegrationConfig(provider)        — decrypted config for server code (CAPI, GSC, Bing)
 *   getPublicIntegrationConfig(provider)  — IDs only, never tokens; safe for the page/browser
 *   listIntegrations()                    — every provider (registry order), public projection
 *   setIntegrationConfig(provider, patch, adminUserId) — encrypts secret fields, upserts
 *   recordTestResult(provider, status, message)        — after a test-connection click
 *
 * Without a database every provider is the disabled seed row. Secret fields are stored as
 * `enc:v1:` envelopes; a blank secret in an update keeps the stored value, `null` clears it.
 */
import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { cache } from "react";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import type { Integration } from "@/db/schema";
import {
  integrations,
  type IntegrationConfig,
  type IntegrationProvider,
  type IntegrationTestStatus,
} from "@/db/schema/integrations";
import { integrationsSeed, SEED_NS, hydrate } from "@/content/seed";
import {
  EncryptionError,
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  isSecretEncryptionConfigured,
} from "@/lib/crypto/secrets";
import { PROVIDER_ORDER, PROVIDERS, secretFieldKeys } from "./providers";

/** Any Drizzle Postgres database over the project schema (postgres.js in the app, PGlite in tests). */
export type IntegrationsDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Full record with secrets decrypted. Server code only — never return this from a route. */
export interface IntegrationRecord {
  id: string;
  provider: IntegrationProvider;
  config: IntegrationConfig;
  isEnabled: boolean;
  loadsInRegions: string[];
  notes: string | null;
  lastVerifiedAt: Date | null;
  lastTestStatus: IntegrationTestStatus | null;
  lastTestMessage: string | null;
  updatedAt: Date;
  /** Secret fields whose stored value could not be decrypted (key rotated away). */
  undecryptable: string[];
}

/** Browser-safe projection: non-secret fields plus which secrets are set. */
export interface PublicIntegration {
  id: string;
  provider: IntegrationProvider;
  label: string;
  config: IntegrationConfig;
  secretsSet: Record<string, boolean>;
  isEnabled: boolean;
  loadsInRegions: string[];
  notes: string | null;
  lastVerifiedAt: Date | null;
  lastTestStatus: IntegrationTestStatus | null;
  lastTestMessage: string | null;
  updatedAt: Date;
}

export interface IntegrationPatch {
  /** Non-secret values replace; secret values: string = encrypt, "" = keep, null = clear. */
  config?: Record<string, string | number | boolean | null | undefined>;
  isEnabled?: boolean;
  loadsInRegions?: string[];
  notes?: string | null;
}

export class SecretsUnavailableError extends Error {
  override name = "SecretsUnavailableError";
  constructor() {
    super("DATA_ENCRYPTION_KEY is not set, so integration secrets cannot be stored");
  }
}

function seedRow(provider: IntegrationProvider): Integration {
  const seed = integrationsSeed.find((r) => r.provider === provider) ?? {
    provider,
    config: {},
    isEnabled: false,
    loadsInRegions: [],
    updatedBy: null,
    lastVerifiedAt: null,
    lastTestStatus: null,
    lastTestMessage: null,
    notes: null,
  };
  return hydrate<Integration>(SEED_NS.integrations, provider, seed);
}

const loadRows = cache(async (db: IntegrationsDb | null): Promise<Integration[]> => {
  if (!db) return PROVIDER_ORDER.map(seedRow);
  const rows = await db.select().from(integrations);
  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  return PROVIDER_ORDER.map((p) => byProvider.get(p) ?? seedRow(p));
});

function resolveDb(db?: IntegrationsDb | null): IntegrationsDb | null {
  return db === undefined ? getDb() : db;
}

function toRecord(row: Integration): IntegrationRecord {
  const secrets = new Set(secretFieldKeys(row.provider));
  const config: IntegrationConfig = {};
  const undecryptable: string[] = [];
  for (const [key, value] of Object.entries(row.config ?? {})) {
    if (secrets.has(key) && isEncryptedSecret(value)) {
      try {
        config[key] = decryptSecret(value);
      } catch {
        config[key] = null;
        undecryptable.push(key);
      }
    } else if (secrets.has(key) && typeof value === "string" && value) {
      // A plaintext secret should never be stored; treat it as unreadable rather than expose it.
      config[key] = null;
      undecryptable.push(key);
    } else {
      config[key] = value;
    }
  }
  return {
    id: row.id,
    provider: row.provider,
    config,
    isEnabled: row.isEnabled,
    loadsInRegions: row.loadsInRegions ?? [],
    notes: row.notes ?? null,
    lastVerifiedAt: row.lastVerifiedAt ?? null,
    lastTestStatus: row.lastTestStatus ?? null,
    lastTestMessage: row.lastTestMessage ?? null,
    updatedAt: row.updatedAt,
    undecryptable,
  };
}

export function toPublic(row: Integration): PublicIntegration {
  const secrets = secretFieldKeys(row.provider);
  const config: IntegrationConfig = {};
  const secretsSet: Record<string, boolean> = {};
  for (const key of secrets) {
    const value = row.config?.[key];
    secretsSet[key] = typeof value === "string" && value.length > 0;
  }
  for (const [key, value] of Object.entries(row.config ?? {})) {
    if (!secrets.includes(key)) config[key] = value;
  }
  return {
    id: row.id,
    provider: row.provider,
    label: PROVIDERS[row.provider].label,
    config,
    secretsSet,
    isEnabled: row.isEnabled,
    loadsInRegions: row.loadsInRegions ?? [],
    notes: row.notes ?? null,
    lastVerifiedAt: row.lastVerifiedAt ?? null,
    lastTestStatus: row.lastTestStatus ?? null,
    lastTestMessage: row.lastTestMessage ?? null,
    updatedAt: row.updatedAt,
  };
}

async function findRow(provider: IntegrationProvider, db: IntegrationsDb | null) {
  const rows = await loadRows(db);
  return rows.find((r) => r.provider === provider) ?? seedRow(provider);
}

/** Decrypted config for server-side callers (CAPI sender, Search Console, Bing). */
export async function getIntegrationConfig(
  provider: IntegrationProvider,
  db?: IntegrationsDb | null,
): Promise<IntegrationRecord> {
  return toRecord(await findRow(provider, resolveDb(db)));
}

/** IDs only — safe to pass to a client component or embed in the page. */
export async function getPublicIntegrationConfig(
  provider: IntegrationProvider,
  db?: IntegrationsDb | null,
): Promise<PublicIntegration> {
  return toPublic(await findRow(provider, resolveDb(db)));
}

/** Every provider in registry order, public projection (disabled seed rows when absent). */
export async function listIntegrations(db?: IntegrationsDb | null): Promise<PublicIntegration[]> {
  return (await loadRows(resolveDb(db))).map(toPublic);
}

/** Enabled providers only — the input of `<Integrations />` and the privacy page. */
export async function listEnabledIntegrations(
  db?: IntegrationsDb | null,
): Promise<PublicIntegration[]> {
  return (await listIntegrations(db)).filter((i) => i.isEnabled);
}

function mergeConfig(
  provider: IntegrationProvider,
  existing: IntegrationConfig,
  patch: NonNullable<IntegrationPatch["config"]>,
): IntegrationConfig {
  const secrets = new Set(secretFieldKeys(provider));
  const known = new Set(PROVIDERS[provider].fields.map((f) => f.key));
  const next: IntegrationConfig = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    if (!known.has(key)) continue;
    if (secrets.has(key)) {
      if (value === null) delete next[key];
      else if (typeof value === "string" && value.trim()) {
        if (!isSecretEncryptionConfigured()) throw new SecretsUnavailableError();
        next[key] = encryptSecret(value.trim());
      }
      // "" or undefined keeps the stored envelope.
      continue;
    }
    if (value === undefined || value === null || value === "") delete next[key];
    else next[key] = typeof value === "string" ? value.trim() : value;
  }
  return next;
}

/**
 * Upsert one provider row. Secret fields are encrypted before the write; the returned
 * before/after are public projections, ready for the audit log.
 */
export async function setIntegrationConfig(
  provider: IntegrationProvider,
  patch: IntegrationPatch,
  adminUserId: string | null,
  db?: IntegrationsDb | null,
): Promise<{ before: PublicIntegration; after: PublicIntegration }> {
  const database = resolveDb(db);
  if (!database) throw new EncryptionError("Database unavailable");
  const existing =
    (await database.select().from(integrations).where(eq(integrations.provider, provider)))[0] ??
    null;
  const before = toPublic(existing ?? seedRow(provider));
  const values = {
    provider,
    config: patch.config ? mergeConfig(provider, existing?.config ?? {}, patch.config) : undefined,
    isEnabled: patch.isEnabled,
    loadsInRegions: patch.loadsInRegions,
    notes: patch.notes,
    updatedBy: adminUserId,
  };
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
  const rows = await database
    .insert(integrations)
    .values({ ...clean, provider })
    .onConflictDoUpdate({ target: integrations.provider, set: clean })
    .returning();
  const after = rows[0];
  if (!after) throw new Error("integrations upsert returned no row");
  return { before, after: toPublic(after) };
}

/** Store the outcome of a test-connection call. */
export async function recordTestResult(
  provider: IntegrationProvider,
  status: IntegrationTestStatus,
  message: string,
  db?: IntegrationsDb | null,
): Promise<void> {
  const database = resolveDb(db);
  if (!database) return;
  const now = new Date();
  await database
    .insert(integrations)
    .values({
      provider,
      lastTestStatus: status,
      lastTestMessage: message.slice(0, 500),
      lastVerifiedAt: status === "ok" ? now : undefined,
    })
    .onConflictDoUpdate({
      target: integrations.provider,
      set: {
        lastTestStatus: status,
        lastTestMessage: message.slice(0, 500),
        ...(status === "ok" ? { lastVerifiedAt: now } : {}),
      },
    });
}
