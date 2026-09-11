/**
 * Auth, roles, audit log and the `adminRoute` wrapper. Runs without Supabase: the dev bypass
 * (never active in production) provides the session; unauthenticated is the no-env case.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import { adminAuditLog, adminUsers } from "@/db/schema";
import { audit, redact } from "@/lib/admin/audit";
import {
  getAdminAuthMode,
  getAdminSession,
  hasRole,
  isDevBypassEnabled,
  ROLE_RANK,
} from "@/lib/admin/auth";
import { adminRoute, AdminRouteError, readAdminBody } from "@/lib/admin/mutations";

function req(method: string, body?: unknown, contentType = "application/json") {
  return new NextRequest("http://localhost/api/admin/test", {
    method,
    headers: body
      ? { "content-type": contentType, "x-forwarded-for": "203.0.113.9", "user-agent": "tests" }
      : {},
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function run() {
  // Roles.
  check(
    ROLE_RANK.viewer < ROLE_RANK.editor && ROLE_RANK.editor < ROLE_RANK.owner,
    "role rank order",
  );
  const viewer = { adminUser: { role: "viewer" as const } };
  check(hasRole(viewer, "viewer") && !hasRole(viewer, "editor"), "viewer is read-only");
  check(hasRole({ adminUser: { role: "owner" as const } }, "editor"), "owner ≥ editor");

  // Bypass gating.
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.ADMIN_DEV_BYPASS = "true";
  const env = process.env as Record<string, string | undefined>;
  const savedNodeEnv = env.NODE_ENV;
  env.NODE_ENV = "production";
  check(!isDevBypassEnabled(), "bypass never active in production");
  equal(getAdminAuthMode(), "not_connected", "production without Supabase → not_connected");
  env.NODE_ENV = "test";
  check(isDevBypassEnabled(), "bypass active outside production when flag is true");
  equal(getAdminAuthMode(), "bypass", "auth mode bypass");
  const session = await getAdminSession();
  check(
    session?.bypass === true && session.adminUser.role === "owner",
    "bypass session is a synthetic owner",
  );

  // adminRoute: validation, handler result, thrown errors.
  const route = adminRoute(
    async ({ data, params, audit: log }) => {
      const result = await log({
        action: "test.update",
        entityType: "test",
        entityId: params.id as string,
        after: data,
      });
      return { got: data.name, audited: result.ok };
    },
    { role: "editor", schema: z.object({ name: z.string().min(2) }), requireDatabase: false },
  );
  const bad = await route(req("POST", { name: "x" }), { params: Promise.resolve({ id: "1" }) });
  equal(bad.status, 400, "validation → 400");
  const badJson = (await bad.json()) as { reason: string; errors: Record<string, string[]> };
  equal(badJson.reason, "validation", "validation reason");
  check(Array.isArray(badJson.errors.name), "field errors keyed by field");

  const ok = await route(req("POST", { name: "Kavita" }), { params: Promise.resolve({ id: "1" }) });
  equal(ok.status, 200, "valid → 200");
  const okJson = (await ok.json()) as { ok: boolean; got: string; audited: boolean };
  check(okJson.ok && okJson.got === "Kavita", "handler result merged into JSON");
  equal(
    okJson.audited,
    false,
    "audit without a database reports not_connected, mutation still completes",
  );

  const form = await route(req("POST", "name=Form+post", "application/x-www-form-urlencoded"), {
    params: Promise.resolve({ id: "2" }),
  });
  equal(form.status, 200, "form-encoded body accepted");

  const throwing = adminRoute(
    async () => {
      throw new AdminRouteError("not_found", "no such thing");
    },
    { requireDatabase: false },
  );
  const nf = await throwing(req("POST"));
  equal(nf.status, 404, "AdminRouteError maps to status");

  const needsDb = adminRoute(async () => ({}), { role: "viewer" });
  equal((await needsDb(req("GET"))).status, 200, "bypass session skips the database requirement");

  // Unauthenticated: no Supabase, bypass off.
  process.env.ADMIN_DEV_BYPASS = "false";
  const unauth = await route(req("POST", { name: "Kavita" }));
  equal(unauth.status, 401, "no session → 401");
  process.env.ADMIN_DEV_BYPASS = "true";

  // readAdminBody edge cases.
  equal(await readAdminBody(req("POST", "{not json")), null, "malformed JSON → null");
  const multi = await readAdminBody(
    req("POST", "a=1&a=2&b=3", "application/x-www-form-urlencoded"),
  );
  check(Array.isArray(multi?.a) && multi?.b === "3", "repeated form fields become arrays");

  // Redaction.
  const red = redact({
    password: "x",
    nested: { apiKey: "k", birthDate: "1990", fine: 1 },
    list: [{ token: "t" }],
  }) as Record<string, unknown>;
  equal(red.password, "[redacted]", "password redacted");
  equal((red.nested as Record<string, unknown>).apiKey, "[redacted]", "nested apiKey redacted");
  equal((red.nested as Record<string, unknown>).birthDate, "[redacted]", "birth details redacted");
  equal((red.nested as Record<string, unknown>).fine, 1, "other values kept");

  // Audit writes a row with the diff and request metadata (PGlite).
  const { db, close } = await createTestDb();
  try {
    const [admin] = await db
      .insert(adminUsers)
      .values({
        authUserId: "11111111-1111-4111-8111-111111111111",
        email: "owner@example.com",
        displayName: "Owner",
        role: "owner",
      })
      .returning();
    const result = await audit({
      db,
      adminUserId: admin!.id,
      action: "services.update",
      entityType: "services",
      entityId: "svc-1",
      before: { price: 100, secretKey: "abc" },
      after: { price: 120 },
      request: req("POST", {}),
    });
    check(result.ok, "audit inserted");
    const rows = await db.select().from(adminAuditLog);
    equal(rows.length, 1, "one audit row");
    const row = rows[0]!;
    equal(row.adminUserId, admin!.id, "audit admin id");
    equal(row.action, "services.update", "audit action");
    equal(
      (row.diff?.before as Record<string, unknown>).secretKey,
      "[redacted]",
      "audit redacts secrets",
    );
    equal((row.diff?.after as Record<string, unknown>).price, 120, "audit after");
    equal(row.ipAddress, "203.0.113.9", "audit ip from forwarded header");
    equal(row.userAgent, "tests", "audit user agent");

    const bypassAudit = await audit({
      db,
      adminUserId: "00000000-0000-4000-8000-00000000adb1",
      action: "x.y",
      entityType: "x",
    });
    check(bypassAudit.ok, "bypass audit still writes (with null admin id)");
    const last = (await db.select().from(adminAuditLog)).at(-1)!;
    equal(last.adminUserId, null, "synthetic admin id stored as null");
  } finally {
    await close();
    env.NODE_ENV = savedNodeEnv;
  }
}
