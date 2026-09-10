/**
 * Admin users (linked to Supabase Auth) and the audit log every admin write appends to.
 */
import {
  index,
  inet,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { adminAll } from "./_policies";
import { id, timestamps } from "./_shared";

export const ADMIN_ROLES = ["owner", "editor", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export const adminRoleEnum = pgEnum("admin_role", ADMIN_ROLES);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: id(),
    /** `auth.users.id` of the Supabase Auth account. */
    authUserId: uuid("auth_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: adminRoleEnum("role").notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    /** Admin-only. `public.is_admin()` reads this table as security definer, so no self-select
     *  policy is needed for the check itself. */
    adminAll("admin_users"),
    uniqueIndex("admin_users_auth_user_uidx").on(t.authUserId),
    uniqueIndex("admin_users_email_uidx").on(t.email),
  ],
);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: id(),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    /** e.g. `services.update`, `redirects.create`, `integrations.enable` */
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    /** `{ before, after }` snapshot; secrets are redacted before logging. */
    diff: jsonb("diff").$type<{ before?: unknown; after?: unknown }>(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    /** Admin-only; appended by route handlers with the service role. */
    adminAll("admin_audit_log"),
    index("admin_audit_log_entity_idx").on(t.entityType, t.entityId),
    index("admin_audit_log_created_idx").on(t.createdAt),
  ],
);
