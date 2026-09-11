/**
 * Generic audit revert (Phase 6, P6-D). Every admin mutation stores `{ before, after }` in
 * `admin_audit_log`; `revertAuditEntry()` re-applies `before` to the entity's table through a
 * registry of revertable entity types (table + key column + column allow/deny lists). A create
 * is reverted by deleting the row, a delete by re-inserting `before`, an update by writing the
 * `before` columns back. Values the audit redacted (`"[redacted]"`) are never written: the
 * current value is kept, so secrets survive a revert. The revert is itself audited.
 */
// No `server-only` marker so the tsx tests can import this module.
import { and, count, desc, eq, getTableColumns, sql, type Column } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";
import { isIntegrationProvider, secretFieldKeys } from "@/lib/integrations/providers";
import { audit, type AuditDb } from "./audit";

export type AuditRow = typeof schema.adminAuditLog.$inferSelect;

type Row = Record<string, unknown>;

export interface RevertableEntity {
  label: string;
  table: PgTable;
  /** Only these JS column keys are written back (default: every column but id/timestamps). */
  only?: string[];
  /** Never written back, on top of id/createdAt/updatedAt. */
  never?: string[];
  /** Adjust the values about to be written given the current row (e.g. keep secrets). */
  merge?: (values: Row, current: Row | null) => Row;
}

/**
 * Keep every integration config key the provider marks secret (and any stored `enc:v1:`
 * envelope) at its current value: a revert never rewrites credentials.
 */
function keepIntegrationSecrets(values: Row, current: Row | null): Row {
  const provider = String(current?.provider ?? values.provider ?? "");
  const config = values.config;
  if (!isRow(config)) return values;
  const currentConfig = isRow(current?.config) ? current.config : {};
  const secretKeys = new Set(isIntegrationProvider(provider) ? secretFieldKeys(provider) : []);
  for (const [key, value] of Object.entries(currentConfig)) {
    if (typeof value === "string" && value.startsWith("enc:v1:")) secretKeys.add(key);
  }
  const merged: Row = { ...config };
  for (const key of secretKeys) {
    if (key in currentConfig) merged[key] = currentConfig[key];
    else delete merged[key];
  }
  return { ...values, config: merged };
}

/** Entity types (the `entity_type` column of the audit log) that can be reverted. */
export const REVERTABLE_ENTITIES: Record<string, RevertableEntity> = {
  services: { label: "Service", table: schema.services },
  faqs: { label: "FAQ", table: schema.faqs },
  testimonials: { label: "Testimonial", table: schema.testimonials },
  locations: {
    label: "Location",
    table: schema.locations,
    /** The audit stores a summary, not the research prose; only these two are safe to restore. */
    only: ["isFeatured", "contentUpdatedAt"],
  },
  site_settings: { label: "Site settings", table: schema.siteSettings },
  social_links: { label: "Social link", table: schema.socialLinks },
  page_seo: { label: "Page SEO", table: schema.pageSeo },
  redirects: { label: "Redirect", table: schema.redirects, never: ["hitCount", "lastHitAt"] },
  integrations: {
    label: "Integration",
    table: schema.integrations,
    never: ["lastVerifiedAt", "lastTestStatus", "lastTestMessage"],
    merge: keepIntegrationSecrets,
  },
  availability_rules: { label: "Availability rule", table: schema.availabilityRules },
  availability_exceptions: {
    label: "Availability exception",
    table: schema.availabilityExceptions,
  },
  notification_templates: { label: "Notification template", table: schema.notificationTemplates },
  feature_flags: { label: "Feature flag", table: schema.featureFlags },
};

export type RevertMode = "update" | "delete" | "insert";

export type RevertCheck =
  { ok: true; mode: RevertMode; entity: RevertableEntity } | { ok: false; reason: string };

const NEVER = new Set(["id", "createdAt", "updatedAt"]);
const REDACTED = "[redacted]";

function isRow(value: unknown): value is Row {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Whether (and how) an audit entry can be reverted. Pure. */
export function checkRevertable(
  entry: Pick<AuditRow, "entityType" | "entityId" | "diff" | "action">,
): RevertCheck {
  const entity = REVERTABLE_ENTITIES[entry.entityType];
  if (!entity)
    return { ok: false, reason: `"${entry.entityType}" is not a revertable entity type.` };
  if (!entry.entityId) return { ok: false, reason: "The entry does not name a single row." };
  const before = entry.diff?.before;
  const after = entry.diff?.after;
  if (before === undefined && after === undefined) {
    return { ok: false, reason: "The entry recorded no before/after snapshot." };
  }
  if (Array.isArray(before) || Array.isArray(after)) {
    return {
      ok: false,
      reason: "Bulk changes (several rows at once) cannot be reverted in one click.",
    };
  }
  if (before !== undefined && !isRow(before))
    return { ok: false, reason: "The snapshot is not a row." };
  if (before === undefined) {
    return isRow(after)
      ? { ok: true, mode: "delete", entity }
      : { ok: false, reason: "The snapshot is not a row." };
  }
  return { ok: true, mode: after === undefined ? "insert" : "update", entity };
}

/** Put current values back where the audit stored `"[redacted]"`, recursively. */
export function restoreRedacted(value: unknown, current: unknown): unknown {
  if (value === REDACTED || value === "[binary]") return current;
  if (Array.isArray(value)) {
    return value.some((v) => v === REDACTED) && Array.isArray(current) ? current : value;
  }
  if (isRow(value)) {
    const out: Row = {};
    const cur = isRow(current) ? current : {};
    for (const [k, v] of Object.entries(value)) out[k] = restoreRedacted(v, cur[k]);
    return out;
  }
  return value;
}

function coerce(column: Column, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (column.dataType === "date" && typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (column.dataType === "number" && typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return value;
}

/**
 * The column values to write for `snapshot`: only real columns of the table, never id or
 * timestamps, honouring the entity's allow/deny lists, redactions restored from `current`.
 */
export function valuesToRestore(entity: RevertableEntity, snapshot: Row, current: Row | null): Row {
  const columns = getTableColumns(entity.table) as Record<string, Column>;
  const restored = restoreRedacted(snapshot, current ?? {}) as Row;
  const values: Row = {};
  for (const [key, column] of Object.entries(columns)) {
    if (NEVER.has(key) || entity.never?.includes(key)) continue;
    if (entity.only && !entity.only.includes(key)) continue;
    if (!(key in restored)) continue;
    const value = coerce(column, restored[key]);
    if (value === undefined) continue;
    values[key] = value;
  }
  return entity.merge ? entity.merge(values, current) : values;
}

export type RevertResult =
  | { ok: true; mode: RevertMode; entityType: string; entityId: string; auditId: string | null }
  | { ok: false; reason: "not_found" | "not_revertable" | "gone" | "conflict"; message: string };

/** Column object for the primary key (`id`) of a table. */
function idColumn(table: PgTable): Column {
  const col = (getTableColumns(table) as Record<string, Column>).id;
  if (!col) throw new Error("revertable tables must have an id column");
  return col;
}

export async function getAuditEntry(db: AuditDb, id: string): Promise<AuditRow | null> {
  const row = await db.query.adminAuditLog.findFirst({ where: eq(schema.adminAuditLog.id, id) });
  return row ?? null;
}

/**
 * Revert one audit entry. `adminUserId`/`request` feed the audit row written for the revert
 * itself (`<entity>.revert`, before = the row as it was, after = the row as restored).
 */
export async function revertAuditEntry(
  db: AuditDb,
  entryId: string,
  actor: { adminUserId: string | null; request?: Request | null },
): Promise<RevertResult> {
  const entry = await getAuditEntry(db, entryId);
  if (!entry) return { ok: false, reason: "not_found", message: "Audit entry not found." };
  const check = checkRevertable(entry);
  if (!check.ok) return { ok: false, reason: "not_revertable", message: check.reason };
  const { entity, mode } = check;
  const entityId = entry.entityId as string;
  const table = entity.table;
  const idCol = idColumn(table);

  const currentRows = (await db.select().from(table).where(eq(idCol, entityId)).limit(1)) as Row[];
  const current = currentRows[0] ?? null;

  let after: Row | null = null;
  if (mode === "delete") {
    if (!current) return { ok: false, reason: "gone", message: "The row was already removed." };
    await db.delete(table).where(eq(idCol, entityId));
  } else if (mode === "insert") {
    if (current) return { ok: false, reason: "conflict", message: "The row exists again already." };
    const values = valuesToRestore(entity, entry.diff?.before as Row, null);
    const inserted = (await db
      .insert(table)
      .values({ ...values, id: entityId } as never)
      .returning()) as Row[];
    after = inserted[0] ?? null;
  } else {
    if (!current) return { ok: false, reason: "gone", message: "The row no longer exists." };
    const values = valuesToRestore(entity, entry.diff?.before as Row, current);
    if (Object.keys(values).length === 0) {
      return {
        ok: false,
        reason: "not_revertable",
        message: "Nothing in the snapshot can be written back.",
      };
    }
    const updated = (await db
      .update(table)
      .set({ ...values, updatedAt: sql`now()` } as never)
      .where(eq(idCol, entityId))
      .returning()) as Row[];
    after = updated[0] ?? null;
  }

  const logged = await audit({
    adminUserId: actor.adminUserId,
    action: `${entry.entityType}.revert`,
    entityType: entry.entityType,
    entityId,
    before: current ?? undefined,
    after: after ? { ...after, _revertOf: entryId } : { _revertOf: entryId, _deleted: true },
    request: actor.request ?? null,
    db,
  });
  return {
    ok: true,
    mode,
    entityType: entry.entityType,
    entityId,
    auditId: logged.ok ? logged.id : null,
  };
}

// --- Viewer queries -----------------------------------------------------------------------------

export interface AuditListFilter {
  entityType?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditEntries(
  db: AuditDb,
  filter: AuditListFilter = {},
): Promise<{ rows: (AuditRow & { adminEmail: string | null })[]; total: number }> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 25));
  const where = and(
    filter.entityType ? eq(schema.adminAuditLog.entityType, filter.entityType) : undefined,
    filter.action ? eq(schema.adminAuditLog.action, filter.action) : undefined,
  );
  const [rows, totals] = await Promise.all([
    db
      .select({
        id: schema.adminAuditLog.id,
        adminUserId: schema.adminAuditLog.adminUserId,
        action: schema.adminAuditLog.action,
        entityType: schema.adminAuditLog.entityType,
        entityId: schema.adminAuditLog.entityId,
        diff: schema.adminAuditLog.diff,
        ipAddress: schema.adminAuditLog.ipAddress,
        userAgent: schema.adminAuditLog.userAgent,
        createdAt: schema.adminAuditLog.createdAt,
        updatedAt: schema.adminAuditLog.updatedAt,
        adminEmail: schema.adminUsers.email,
      })
      .from(schema.adminAuditLog)
      .leftJoin(schema.adminUsers, eq(schema.adminUsers.id, schema.adminAuditLog.adminUserId))
      .where(where)
      .orderBy(desc(schema.adminAuditLog.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(schema.adminAuditLog).where(where),
  ]);
  return { rows, total: totals[0]?.n ?? 0 };
}

/** Distinct entity types present in the log, for the filter select. */
export async function listAuditEntityTypes(db: AuditDb): Promise<string[]> {
  const rows = await db
    .selectDistinct({ entityType: schema.adminAuditLog.entityType })
    .from(schema.adminAuditLog)
    .orderBy(schema.adminAuditLog.entityType);
  return rows.map((r) => r.entityType);
}

// --- Diff rendering (pure) ---------------------------------------------------------------------

export interface DiffLine {
  key: string;
  before: string | null;
  after: string | null;
  changed: boolean;
}

function show(value: unknown): string | null {
  if (value === undefined) return null;
  if (value === null) return "null";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");
}

/** Flat key-by-key comparison of two snapshots, changed keys first. */
export function diffLines(before: unknown, after: unknown): DiffLine[] {
  const b = isRow(before) ? before : {};
  const a = isRow(after) ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  const lines = keys.map((key) => {
    const bv = show(b[key]);
    const av = show(a[key]);
    return { key, before: bv, after: av, changed: bv !== av };
  });
  return lines.sort((x, y) => Number(y.changed) - Number(x.changed) || x.key.localeCompare(y.key));
}
