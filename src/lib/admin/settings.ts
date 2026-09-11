/**
 * Settings management (Phase 5 P5-C): feature flags with environment fallback, notification
 * template overrides, availability rules/exceptions, admin users and the `site_settings` row.
 * Every write takes an explicit `db` (from `getDb()` in a route handler, PGlite in tests) and
 * returns `{ before, after }` so the route can audit it. No `server-only` import: the
 * notification layer and the tests import this module outside Next.
 */
import { and, asc, eq, gte } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import {
  FEATURE_FLAG_KEYS,
  adminUsers,
  availabilityExceptions,
  availabilityRules,
  featureFlags,
  notificationTemplates,
  siteSettings,
  type AdminUser,
  type AvailabilityException,
  type AvailabilityRule,
  type FeatureFlag,
  type FeatureFlagKey,
  type FeatureFlagValue,
  type NotificationTemplate,
  type SiteSettings,
  type TemplateRecipient,
} from "@/db/schema";
import { availabilityRulesSeed } from "@/content/seed";
import type { BookingDb } from "@/lib/booking/db";
import { bookingReference } from "@/lib/notifications/model";
import type { BookingWithRelations, NotificationKind } from "@/lib/notifications/types";
import { getServiceClient } from "@/lib/storage/supabase";
import type {
  adminInviteSchema,
  adminUserUpdateSchema,
  availabilityExceptionSchema,
  availabilityRuleSchema,
  featureFlagSchema,
  notificationTemplateSchema,
  siteSettingsUpdateSchema,
} from "./manage-schemas";

export type ManageDb = BookingDb;

// --- feature flags ----------------------------------------------------------------------------

export interface ResolvedFlag {
  key: FeatureFlagKey;
  value: FeatureFlagValue;
  /** Where the value came from. */
  source: "database" | "environment" | "default";
  description: string | null;
  updatedAt: Date | null;
}

const FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
  PAYMENTS_ENABLED: "Collect fees online at booking time (CLAUDE.md §11). Requires a gateway.",
  WHATSAPP_NOTIFICATIONS_ENABLED: "Send booking messages on WhatsApp as well as email.",
  FEATURE_SOCIAL_WIDGETS: "Show the YouTube / Instagram social-proof widgets (after consent).",
};

export function flagDescription(key: FeatureFlagKey): string {
  return FLAG_DESCRIPTIONS[key];
}

function envFlag(key: FeatureFlagKey, env: Record<string, string | undefined>): boolean | null {
  const raw = env[key]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return null;
  return raw === "true" || raw === "1" || raw === "on";
}

/** Database row → environment variable → `false`. Pure given `rows`; tests pass them directly. */
export function resolveFlagFrom(
  key: FeatureFlagKey,
  rows: readonly Pick<FeatureFlag, "key" | "value" | "description" | "updatedAt">[],
  env: Record<string, string | undefined> = process.env,
): ResolvedFlag {
  const row = rows.find((r) => r.key === key);
  if (row) {
    return {
      key,
      value: row.value,
      source: "database",
      description: row.description ?? FLAG_DESCRIPTIONS[key],
      updatedAt: row.updatedAt,
    };
  }
  const fromEnv = envFlag(key, env);
  return {
    key,
    value: fromEnv ?? false,
    source: fromEnv === null ? "default" : "environment",
    description: FLAG_DESCRIPTIONS[key],
    updatedAt: null,
  };
}

export async function listFlags(db: ManageDb | null): Promise<ResolvedFlag[]> {
  const rows = db ? await db.select().from(featureFlags) : [];
  return FEATURE_FLAG_KEYS.map((key) => resolveFlagFrom(key, rows));
}

/** The app-facing read: `true` only when the flag resolves to boolean `true`. */
export async function isFlagEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await listFlags(getDb());
  return flags.find((f) => f.key === key)?.value === true;
}

export async function setFlag(
  db: ManageDb,
  input: z.output<typeof featureFlagSchema>,
  adminUserId: string | null,
): Promise<{ before: FeatureFlag | null; after: FeatureFlag }> {
  const before =
    (await db.select().from(featureFlags).where(eq(featureFlags.key, input.key)))[0] ?? null;
  const [after] = await db
    .insert(featureFlags)
    .values({
      key: input.key,
      value: input.value,
      description: input.description ?? FLAG_DESCRIPTIONS[input.key],
      updatedBy: adminUserId,
    })
    .onConflictDoUpdate({
      target: featureFlags.key,
      set: {
        value: input.value,
        description: input.description ?? FLAG_DESCRIPTIONS[input.key],
        updatedBy: adminUserId,
      },
    })
    .returning();
  if (!after) throw new Error("feature flag upsert returned nothing");
  return { before, after };
}

// --- notification templates --------------------------------------------------------------------

export interface TemplateOverride {
  subject: string | null;
  intro: string | null;
}

export async function listTemplates(db: ManageDb | null): Promise<NotificationTemplate[]> {
  if (!db) return [];
  return db
    .select()
    .from(notificationTemplates)
    .orderBy(asc(notificationTemplates.kind), asc(notificationTemplates.recipient));
}

export async function upsertTemplate(
  db: ManageDb,
  input: z.output<typeof notificationTemplateSchema>,
  adminUserId: string | null,
): Promise<{ before: NotificationTemplate | null; after: NotificationTemplate }> {
  const before =
    (
      await db
        .select()
        .from(notificationTemplates)
        .where(
          and(
            eq(notificationTemplates.kind, input.kind),
            eq(notificationTemplates.recipient, input.recipient),
          ),
        )
    )[0] ?? null;
  const values = {
    subject: input.subject,
    intro: input.intro,
    isEnabled: input.isEnabled,
    updatedBy: adminUserId,
  };
  const [after] = await db
    .insert(notificationTemplates)
    .values({ kind: input.kind, recipient: input.recipient, ...values })
    .onConflictDoUpdate({
      target: [notificationTemplates.kind, notificationTemplates.recipient],
      set: values,
    })
    .returning();
  if (!after) throw new Error("notification template upsert returned nothing");
  return { before, after };
}

/**
 * The enabled override for `(kind, recipient)`, or `null` when there is none or no database.
 * Called by `notify()` on every email; a database error must never block a message.
 */
export async function getTemplateOverride(
  kind: NotificationKind,
  recipient: TemplateRecipient,
  db: ManageDb | null = getDb(),
): Promise<TemplateOverride | null> {
  if (!db) return null;
  try {
    const [row] = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.kind, kind),
          eq(notificationTemplates.recipient, recipient),
          eq(notificationTemplates.isEnabled, true),
        ),
      )
      .limit(1);
    if (!row || (!row.subject && !row.intro)) return null;
    return { subject: row.subject, intro: row.intro };
  } catch {
    return null;
  }
}

/** Placeholder values an override may use. Never birth details, never the client's contact. */
export function templateVariables(data: BookingWithRelations): Record<string, string> {
  const first = data.client.fullName.trim().split(/\s+/)[0] ?? data.client.fullName;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: data.booking.clientTimezone || data.client.timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(data.booking.startsAt);
  return {
    clientFirstName: first,
    serviceName: data.service.name,
    date,
    brandName: data.settings.brandName,
    bookingRef: bookingReference(data.booking.id),
  };
}

export function fillPlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([A-Za-z]+)\s*\}\}/g, (m, key: string) => vars[key] ?? m);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Apply an override to a rendered email: the subject is replaced; the intro becomes the first
 * paragraph under the heading (HTML) and the first paragraph of the plain text. Pure.
 */
export function applyTemplateOverride<T extends { subject: string; html: string; text: string }>(
  rendered: T,
  override: TemplateOverride | null,
  vars: Record<string, string>,
): T {
  if (!override) return rendered;
  let { subject, html, text } = rendered;
  if (override.subject) subject = fillPlaceholders(override.subject, vars).slice(0, 200);
  if (override.intro) {
    const intro = fillPlaceholders(override.intro, vars).trim();
    const paragraph = `<p data-template-intro style="margin:0 0 14px;font-size:16px;line-height:1.6">${escapeHtml(intro)}</p>`;
    html = /<\/h1>/i.test(html) ? html.replace(/<\/h1>/i, `</h1>${paragraph}`) : paragraph + html;
    text = `${intro}\n\n${text}`;
  }
  return { ...rendered, subject, html, text };
}

// --- availability -----------------------------------------------------------------------------

export interface AvailabilityAdmin {
  rules: AvailabilityRule[];
  /** True while the unconfirmed seed rules are shown (no rows in the table / no database). */
  placeholderRules: boolean;
  exceptions: AvailabilityException[];
}

export async function getAvailabilityAdmin(
  db: ManageDb | null,
  now = new Date(),
): Promise<AvailabilityAdmin> {
  const seed: AvailabilityRule[] = availabilityRulesSeed.map((r, i) => ({
    id: `seed-${i}`,
    weekday: r.weekday,
    startTime: r.startTime,
    endTime: r.endTime,
    serviceId: r.serviceId ?? null,
    isActive: r.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }));
  if (!db) return { rules: seed, placeholderRules: true, exceptions: [] };
  const [rules, exceptions] = await Promise.all([
    db
      .select()
      .from(availabilityRules)
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime)),
    db
      .select()
      .from(availabilityExceptions)
      .where(gte(availabilityExceptions.endsAt, new Date(now.getTime() - 30 * 86_400_000)))
      .orderBy(asc(availabilityExceptions.startsAt)),
  ]);
  return { rules: rules.length ? rules : seed, placeholderRules: rules.length === 0, exceptions };
}

/** Replace the whole weekly grid in one transaction (the editor posts every row). */
export async function replaceWeeklyRules(
  db: ManageDb,
  rules: z.output<typeof availabilityRuleSchema>[],
): Promise<{ before: AvailabilityRule[]; after: AvailabilityRule[] }> {
  const before = await db.select().from(availabilityRules);
  const after = await db.transaction(async (tx) => {
    await tx.delete(availabilityRules);
    if (rules.length === 0) return [];
    return tx
      .insert(availabilityRules)
      .values(rules.map((r) => ({ ...r, serviceId: r.serviceId ?? null })))
      .returning();
  });
  return { before, after };
}

export async function addException(
  db: ManageDb,
  input: z.output<typeof availabilityExceptionSchema>,
): Promise<AvailabilityException> {
  const [row] = await db.insert(availabilityExceptions).values(input).returning();
  if (!row) throw new Error("exception insert returned nothing");
  return row;
}

export async function deleteException(
  db: ManageDb,
  id: string,
): Promise<AvailabilityException | null> {
  const [row] = await db
    .delete(availabilityExceptions)
    .where(eq(availabilityExceptions.id, id))
    .returning();
  return row ?? null;
}

// --- admin users ------------------------------------------------------------------------------

export async function listAdminUsers(db: ManageDb | null): Promise<AdminUser[]> {
  if (!db) return [];
  return db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));
}

export type InviteResult =
  | { ok: true; user: AdminUser; invited: boolean }
  | { ok: false; reason: "auth_not_configured" | "invite_failed" | "exists" };

/**
 * Invite by email: creates the Supabase Auth user with an invite email (service role), then the
 * `admin_users` row. Without a Supabase service client nothing is written and the UI explains.
 */
export async function inviteAdminUser(
  db: ManageDb,
  input: z.output<typeof adminInviteSchema>,
  deps: { auth?: { inviteUserByEmail(email: string): Promise<{ id: string } | null> } } = {},
): Promise<InviteResult> {
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, input.email));
  if (existing.length) return { ok: false, reason: "exists" };
  const auth = deps.auth ?? supabaseInviter();
  if (!auth) return { ok: false, reason: "auth_not_configured" };
  const created = await auth.inviteUserByEmail(input.email);
  if (!created) return { ok: false, reason: "invite_failed" };
  const [user] = await db
    .insert(adminUsers)
    .values({
      authUserId: created.id,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      isActive: true,
    })
    .returning();
  if (!user) throw new Error("admin user insert returned nothing");
  return { ok: true, user, invited: true };
}

function supabaseInviter() {
  const client = getServiceClient();
  if (!client) return null;
  return {
    async inviteUserByEmail(email: string) {
      const { data, error } = await client.auth.admin.inviteUserByEmail(email);
      if (error || !data.user) return null;
      return { id: data.user.id };
    },
  };
}

export async function updateAdminUser(
  db: ManageDb,
  id: string,
  input: z.output<typeof adminUserUpdateSchema>,
): Promise<{ before: AdminUser | null; after: AdminUser | null }> {
  const before = (await db.select().from(adminUsers).where(eq(adminUsers.id, id)))[0] ?? null;
  if (!before) return { before: null, after: null };
  const set: Partial<AdminUser> = {};
  if (input.role !== undefined) set.role = input.role;
  if (input.isActive !== undefined) set.isActive = input.isActive;
  if (input.displayName !== undefined) set.displayName = input.displayName;
  const [after] = await db.update(adminUsers).set(set).where(eq(adminUsers.id, id)).returning();
  return { before, after: after ?? null };
}

/** The owner cannot demote or deactivate the last active owner. */
export async function wouldRemoveLastOwner(
  db: ManageDb,
  id: string,
  input: z.output<typeof adminUserUpdateSchema>,
): Promise<boolean> {
  const demoting = input.role !== undefined && input.role !== "owner";
  const deactivating = input.isActive === false;
  if (!demoting && !deactivating) return false;
  const owners = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, "owner"), eq(adminUsers.isActive, true)));
  return owners.length === 1 && owners[0]?.id === id;
}

// --- site settings ----------------------------------------------------------------------------

export async function updateSiteSettings(
  db: ManageDb,
  input: z.output<typeof siteSettingsUpdateSchema>,
): Promise<{ before: SiteSettings | null; after: SiteSettings | null }> {
  const before = (await db.select().from(siteSettings).limit(1))[0] ?? null;
  if (!before) return { before: null, after: null };
  const set = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<SiteSettings>;
  const [after] = await db
    .update(siteSettings)
    .set(set)
    .where(eq(siteSettings.id, before.id))
    .returning();
  return { before, after: after ?? null };
}
