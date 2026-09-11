/**
 * Redirect persistence (Phase 6, P6-B): validation, create/update/delete, CSV import and the
 * loop/chain check every save goes through. Takes an explicit database so the admin routes
 * (postgres.js) and the tests (PGlite) share one code path. After any write the caller
 * invalidates the in-process cache (`invalidateRedirectCache()`) and pings
 * `POST /api/redirects/refresh` so other instances reload.
 */
import { asc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import type * as schema from "@/db/schema";
import {
  REDIRECT_MATCH_TYPES,
  REDIRECT_SOURCES,
  REDIRECT_STATUSES,
  redirects,
  type RedirectSource,
} from "@/db/schema/redirects";
import { checkChain, type ChainCheck } from "./graph";
import {
  isValidDestination,
  normalisePathname,
  validatePattern,
  type RedirectRule,
} from "./matchers";
import type { CsvRedirectRow } from "./csv";

export type RedirectDb = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Redirect = typeof redirects.$inferSelect;

const formBoolean = z
  .union([z.boolean(), z.string(), z.number(), z.undefined(), z.null()])
  .transform((v) => v === true || v === 1 || v === "true" || v === "on" || v === "1");

export const redirectInputSchema = z
  .object({
    fromPath: z.string().trim().min(1).max(512),
    toPath: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    matchType: z.enum(REDIRECT_MATCH_TYPES).default("exact"),
    statusCode: z.coerce
      .number()
      .int()
      .refine((n) => (REDIRECT_STATUSES as readonly number[]).includes(n), {
        message: `status must be one of ${REDIRECT_STATUSES.join(", ")}`,
      })
      .default(301),
    isActive: formBoolean.default(true),
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    source: z.enum(REDIRECT_SOURCES).default("manual"),
    /** When true, a chained destination is rewritten to the chain's final hop. */
    collapseChain: formBoolean.default(false),
  })
  .superRefine((value, ctx) => {
    const problem = validatePattern(value.fromPath, value.matchType);
    if (problem) {
      ctx.addIssue({
        code: "custom",
        path: ["fromPath"],
        message: PATTERN_MESSAGES[problem],
      });
    }
    if (value.statusCode !== 410) {
      if (!value.toPath) {
        ctx.addIssue({ code: "custom", path: ["toPath"], message: "destination is required" });
      } else if (!isValidDestination(value.toPath)) {
        ctx.addIssue({
          code: "custom",
          path: ["toPath"],
          message: "destination must be a site path (/x) or an http(s) URL",
        });
      }
    }
  });
export type RedirectInput = z.output<typeof redirectInputSchema>;

const PATTERN_MESSAGES = {
  empty: "source is required",
  too_long: "source is too long (512 characters max)",
  not_absolute: "source must start with /",
  invalid_regex: "source is not a valid regular expression",
  unsafe_regex:
    "source regex could backtrack catastrophically (nested quantifiers, back-references)",
  no_wildcard: "a wildcard rule needs a * in the source",
} as const;

export class RedirectSaveError extends Error {
  readonly reason: "loop" | "duplicate" | "not_found";
  readonly check: ChainCheck | undefined;
  constructor(reason: "loop" | "duplicate" | "not_found", message: string, check?: ChainCheck) {
    super(message);
    this.name = "RedirectSaveError";
    this.reason = reason;
    this.check = check;
  }
}

export async function listRedirects(db: RedirectDb): Promise<Redirect[]> {
  return db.select().from(redirects).orderBy(asc(redirects.createdAt));
}

export async function getRedirect(db: RedirectDb, id: string): Promise<Redirect | null> {
  return (await db.select().from(redirects).where(eq(redirects.id, id)))[0] ?? null;
}

function toRule(row: Redirect): RedirectRule {
  return {
    id: row.id,
    fromPath: row.fromPath,
    toPath: row.toPath,
    matchType: row.matchType,
    statusCode: row.statusCode,
  };
}

/** Normalised source for exact rules; patterns are stored as typed. */
function storedSource(input: Pick<RedirectInput, "fromPath" | "matchType">): string {
  return input.matchType === "exact" ? normalisePathname(input.fromPath) : input.fromPath.trim();
}

/** Loop refusal + chain resolution. Returns the destination to store and the check. */
export async function prepareSave(
  db: RedirectDb,
  input: RedirectInput,
  excludeId?: string,
): Promise<{ toPath: string | null; check: ChainCheck }> {
  const existing = (await listRedirects(db)).filter((r) => r.isActive).map(toRule);
  const fromPath = storedSource(input);
  const candidate = {
    id: excludeId,
    fromPath,
    toPath: input.statusCode === 410 ? null : input.toPath,
    statusCode: input.statusCode,
    matchType: input.matchType,
  };
  const check = checkChain(candidate, existing);
  if (check.loop)
    throw new RedirectSaveError("loop", `${fromPath} would redirect to itself`, check);
  const toPath =
    input.collapseChain && check.chain.length > 0 && check.finalDestination
      ? check.finalDestination
      : candidate.toPath;
  return { toPath, check };
}

export interface SaveResult {
  redirect: Redirect;
  check: ChainCheck;
}

export async function createRedirect(db: RedirectDb, input: RedirectInput): Promise<SaveResult> {
  const fromPath = storedSource(input);
  const dup = (
    await db.select({ id: redirects.id }).from(redirects).where(eq(redirects.fromPath, fromPath))
  )[0];
  if (dup) throw new RedirectSaveError("duplicate", `a rule for ${fromPath} already exists`);
  const { toPath, check } = await prepareSave(db, input);
  const [row] = await db
    .insert(redirects)
    .values({
      fromPath,
      toPath,
      matchType: input.matchType,
      statusCode: input.statusCode,
      isActive: input.isActive,
      note: input.note,
      source: input.source,
    })
    .returning();
  if (!row) throw new Error("redirect insert returned nothing");
  return { redirect: row, check };
}

export async function updateRedirect(
  db: RedirectDb,
  id: string,
  input: RedirectInput,
): Promise<SaveResult & { before: Redirect }> {
  const before = await getRedirect(db, id);
  if (!before) throw new RedirectSaveError("not_found", "redirect not found");
  const fromPath = storedSource(input);
  if (fromPath !== before.fromPath) {
    const dup = (
      await db.select({ id: redirects.id }).from(redirects).where(eq(redirects.fromPath, fromPath))
    )[0];
    if (dup && dup.id !== id)
      throw new RedirectSaveError("duplicate", `a rule for ${fromPath} already exists`);
  }
  const { toPath, check } = await prepareSave(db, input, id);
  const [row] = await db
    .update(redirects)
    .set({
      fromPath,
      toPath,
      matchType: input.matchType,
      statusCode: input.statusCode,
      isActive: input.isActive,
      note: input.note,
    })
    .where(eq(redirects.id, id))
    .returning();
  if (!row) throw new RedirectSaveError("not_found", "redirect not found");
  return { redirect: row, check, before };
}

export async function deleteRedirect(db: RedirectDb, id: string): Promise<Redirect | null> {
  const rows = await db.delete(redirects).where(eq(redirects.id, id)).returning();
  return rows[0] ?? null;
}

/** Rewrite every exact rule that points at `from` so it points at `to` (collapse incoming chains). */
export async function collapseIncoming(db: RedirectDb, from: string, to: string): Promise<number> {
  const target = normalisePathname(from);
  const rows = await db
    .select({ id: redirects.id, toPath: redirects.toPath, matchType: redirects.matchType })
    .from(redirects)
    .where(eq(redirects.isActive, true));
  const ids = rows
    .filter((r) => r.matchType === "exact" && r.toPath && normalisePathname(r.toPath) === target)
    .map((r) => r.id);
  if (ids.length === 0) return 0;
  await db.update(redirects).set({ toPath: to }).where(inArray(redirects.id, ids));
  return ids.length;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: { line: number; source: string; message: string }[];
}

/** Upsert CSV rows by source; loops are skipped with a message, chains are collapsed. */
export async function importRedirects(
  db: RedirectDb,
  rows: readonly CsvRedirectRow[],
  source: RedirectSource = "import",
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: [] };
  for (const [i, row] of rows.entries()) {
    const parsed = redirectInputSchema.safeParse({
      fromPath: row.source,
      toPath: row.destination || null,
      matchType: row.match,
      statusCode: row.type,
      note: row.note || null,
      source,
      collapseChain: true,
    });
    if (!parsed.success) {
      result.skipped.push({
        line: i + 2,
        source: row.source,
        message: parsed.error.issues.map((iss) => iss.message).join("; "),
      });
      continue;
    }
    try {
      const fromPath = storedSource(parsed.data);
      const existing = (
        await db
          .select({ id: redirects.id })
          .from(redirects)
          .where(eq(redirects.fromPath, fromPath))
      )[0];
      if (existing) {
        await updateRedirect(db, existing.id, parsed.data);
        result.updated += 1;
      } else {
        await createRedirect(db, parsed.data);
        result.created += 1;
      }
    } catch (error) {
      result.skipped.push({
        line: i + 2,
        source: row.source,
        message: error instanceof Error ? error.message : "failed",
      });
    }
  }
  return result;
}

export function toCsvRows(rows: readonly Redirect[]): CsvRedirectRow[] {
  return rows.map((r) => ({
    source: r.fromPath,
    destination: r.toPath ?? "",
    type: r.statusCode,
    note: r.note ?? "",
    match: r.matchType,
  }));
}
