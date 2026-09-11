/**
 * Admin audit log (Phase 5, P5-B). EVERY admin mutation calls `audit()` with a before/after
 * snapshot; `adminRoute()` hands route handlers a pre-bound `ctx.audit`. Secrets are redacted
 * before the diff is stored and personal birth details are never included by callers — pass
 * the entity's non-sensitive projection as `before`/`after`.
 */
// No `server-only` marker so the tsx test scripts can import this module; `next/headers` and
// `@/db` already make it unusable from client code.
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import { adminAuditLog } from "@/db/schema/admin";
import { clientIpFromHeaders } from "@/lib/rate-limit";

/** Any Drizzle Postgres database over the project schema (postgres.js in the app, PGlite in tests). */
export type AuditDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface AuditEntry {
  /** `admin_users.id`; `null` for system actions. The dev-bypass id is stored as `null`. */
  adminUserId: string | null;
  /** `<entity>.<verb>`, e.g. `bookings.confirm`, `social_links.reorder`. */
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  /** Source request, for IP (from the platform edge headers) and user agent. */
  request?: Request | null;
  /** Override the database (tests). */
  db?: AuditDb | null;
}

export type AuditResult = { ok: true; id: string } | { ok: false; reason: "not_connected" };

const SECRET_KEY = /(secret|token|password|passwd|api[-_]?key|private[-_]?key|authorization)/i;
/** Personal data that must never land in the audit diff even if a caller passes it through. */
const PERSONAL_KEY =
  /^(birth(date|time|place|_date|_time|_place)|birthDetails|birth_details|encrypted.*|.*_cipher)$/i;

/** Deep-copy `value` with secret-looking and personal keys replaced by `"[redacted]"`. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return "[binary]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEY.test(key) || PERSONAL_KEY.test(key) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BYPASS_ADMIN_ID = "00000000-0000-4000-8000-00000000adb1";

function ipFrom(request: Request | null | undefined): string | null {
  if (!request) return null;
  const ip = clientIpFromHeaders(request.headers);
  return ip === "unknown" ? null : ip;
}

/**
 * Append one row to `admin_audit_log`. Never throws for a missing database (returns
 * `not_connected`) so the mutation it documents still completes in offline development.
 */
export async function audit(entry: AuditEntry): Promise<AuditResult> {
  const db = entry.db === undefined ? getDb() : entry.db;
  if (!db) return { ok: false, reason: "not_connected" };
  const adminUserId =
    entry.adminUserId && entry.adminUserId !== BYPASS_ADMIN_ID && UUID.test(entry.adminUserId)
      ? entry.adminUserId
      : null;
  const diff: { before?: unknown; after?: unknown } = {};
  if (entry.before !== undefined) diff.before = redact(entry.before);
  if (entry.after !== undefined) diff.after = redact(entry.after);
  const rows = await db
    .insert(adminAuditLog)
    .values({
      adminUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      diff,
      ipAddress: ipFrom(entry.request),
      userAgent: entry.request?.headers.get("user-agent")?.slice(0, 512) ?? null,
    })
    .returning({ id: adminAuditLog.id });
  const id = rows[0]?.id;
  return id ? { ok: true, id } : { ok: false, reason: "not_connected" };
}
