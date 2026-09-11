/**
 * `adminRoute()` — the one wrapper every `/api/admin/*` route handler uses (Phase 5, P5-B).
 *
 *   export const POST = adminRoute(
 *     async ({ data, session, audit }) => { …; await audit({ … }); return { ok: true, … }; },
 *     { role: "editor", schema: bodySchema },
 *   );
 *
 * Order: session (401 `unauthorized`) → role (403 `forbidden`; viewer is read-only) → body
 * (400 `bad_request` / `validation` + field errors) → handler. Handler exceptions become a
 * 500 `server_error` with only the error class logged. A handler may return a plain object
 * (sent as JSON, 200) or a full `Response`. `AdminRouteError` maps a reason to a status.
 * Route handlers only — client components never touch the database (CLAUDE.md §3).
 */
// No `server-only` marker so the tsx test scripts can import this module; `next/headers` and
// `@/db` already make it unusable from client code.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { isDatabaseConfigured } from "@/db";
import { audit as writeAudit, type AuditEntry, type AuditResult } from "./audit";
import { getAdminSession, hasRole, type AdminRole, type AdminSession } from "./auth";

export const NO_STORE = { "cache-control": "no-store" } as const;

export type AdminErrorReason =
  | "unauthorized"
  | "forbidden"
  | "bad_request"
  | "validation"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "not_connected"
  | "server_error";

export function statusForReason(reason: AdminErrorReason): number {
  switch (reason) {
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "bad_request":
    case "validation":
      return 400;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "rate_limited":
      return 429;
    case "not_connected":
      return 503;
    default:
      return 500;
  }
}

/** Throw from a handler to answer with a typed JSON error. */
export class AdminRouteError extends Error {
  readonly reason: AdminErrorReason;
  readonly details: Record<string, unknown> | undefined;
  constructor(reason: AdminErrorReason, message?: string, details?: Record<string, unknown>) {
    super(message ?? reason);
    this.name = "AdminRouteError";
    this.reason = reason;
    this.details = details;
  }
}

export function jsonOk(body: Record<string, unknown> = {}, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...body }, { status, headers: NO_STORE });
}

export function jsonError(
  reason: AdminErrorReason,
  extra: Record<string, unknown> = {},
  status = statusForReason(reason),
): NextResponse {
  return NextResponse.json({ ok: false, reason, ...extra }, { status, headers: NO_STORE });
}

/** `{ field: [messages] }` from a Zod error, keyed by the first path segment. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

type Body = Record<string, unknown>;

/** JSON, `application/x-www-form-urlencoded` and `multipart/form-data` become one object. */
export async function readAdminBody(request: Request): Promise<Body | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const parsed: unknown = await request.json();
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Body)
        : null;
    }
    if (type.includes("form-urlencoded") || type.includes("multipart/form-data")) {
      const form = await request.formData();
      const out: Body = {};
      for (const [key, value] of form.entries()) {
        if (typeof value !== "string") continue;
        // Repeated fields (checkbox groups, ordered lists) become arrays.
        const existing = out[key];
        if (existing === undefined) out[key] = value;
        else if (Array.isArray(existing)) existing.push(value);
        else out[key] = [existing, value];
      }
      return out;
    }
  } catch {
    return null;
  }
  return type ? null : {};
}

export type BoundAudit = (
  entry: Omit<AuditEntry, "adminUserId" | "request">,
) => Promise<AuditResult>;

export interface AdminRouteContext<TData> {
  request: NextRequest;
  session: AdminSession;
  /** Parsed and validated body (`undefined` when no `schema` was given). */
  data: TData;
  /** Dynamic segment params (`[id]`), already awaited. */
  params: Record<string, string | string[] | undefined>;
  /** URL search params, for filters on GET handlers. */
  searchParams: URLSearchParams;
  /** `audit()` pre-bound with the admin id and the request. */
  audit: BoundAudit;
}

export interface AdminRouteOptions<S extends z.ZodType | undefined> {
  /** Minimum role. Defaults to `editor`, so a viewer can never reach a mutation by accident. */
  role?: AdminRole;
  /** Body schema. When present the body is parsed (JSON or form) and validated. */
  schema?: S;
  /** Fail with 503 `not_connected` when no database is configured (default `true`). */
  requireDatabase?: boolean;
}

type Inferred<S> = S extends z.ZodType ? z.output<S> : undefined;
type RouteParams = { params?: Promise<Record<string, string | string[] | undefined>> };
export type AdminHandler<TData> = (
  ctx: AdminRouteContext<TData>,
) => Promise<Response | Record<string, unknown> | void>;

export function adminRoute<S extends z.ZodType | undefined = undefined>(
  handler: AdminHandler<Inferred<S>>,
  options: AdminRouteOptions<S> = {},
) {
  const minimumRole = options.role ?? "editor";
  const requireDatabase = options.requireDatabase ?? true;

  return async function route(request: NextRequest, ctx?: RouteParams): Promise<NextResponse> {
    const session = await getAdminSession();
    if (!session) return jsonError("unauthorized");
    if (!hasRole(session, minimumRole)) {
      return jsonError("forbidden", { required: minimumRole, role: session.adminUser.role });
    }

    let data: unknown = undefined;
    if (options.schema) {
      const body = await readAdminBody(request);
      if (!body) return jsonError("bad_request");
      const parsed = options.schema.safeParse(body);
      if (!parsed.success) return jsonError("validation", { errors: fieldErrors(parsed.error) });
      data = parsed.data;
    }

    if (requireDatabase && !session.bypass && !isDatabaseConfigured()) {
      return jsonError("not_connected");
    }

    const boundAudit: BoundAudit = (entry) =>
      writeAudit({ ...entry, adminUserId: session.adminUser.id, request });

    try {
      const params = (await ctx?.params) ?? {};
      const result = await handler({
        request,
        session,
        data: data as Inferred<S>,
        params,
        searchParams: request.nextUrl.searchParams,
        audit: boundAudit,
      });
      if (result instanceof Response) return result as NextResponse;
      return jsonOk(result ?? {});
    } catch (error) {
      if (error instanceof AdminRouteError) {
        return jsonError(error.reason, { message: error.message, ...(error.details ?? {}) });
      }
      console.error(
        `[admin] ${request.method} ${request.nextUrl.pathname} failed: ${
          error instanceof Error ? error.name : "unknown error"
        }`,
      );
      return jsonError("server_error");
    }
  };
}
