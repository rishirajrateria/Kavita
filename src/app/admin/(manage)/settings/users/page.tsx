import type { Metadata } from "next";
import { getDb } from "@/db";
import { ADMIN_ROLES } from "@/db/schema";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDate } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { SETTINGS_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin, roleLabel } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/settings";
import { getSiteSettings } from "@/lib/data";
import { isStorageConfigured } from "@/lib/storage/supabase";

export const metadata: Metadata = { title: "Users & roles" };
export const dynamic = "force-dynamic";

const selectClass =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm dark:bg-input/30";

export default async function UsersPage() {
  const db = getDb();
  const [session, users, settings] = await Promise.all([
    requireAdmin(),
    listAdminUsers(db),
    getSiteSettings(),
  ]);
  const isOwner = session.adminUser.role === "owner";
  const canInvite = isOwner && Boolean(db) && isStorageConfigured();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Users & roles"
        description="Owner: everything, including users and flags. Editor: bookings and content. Viewer: read-only, and never sees birth details."
      />
      <SubNav items={SETTINGS_NAV} current="/admin/settings/users" label="Settings sections" />
      {!db ? <OfflineNote what="Invitations and role changes" /> : null}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Admins" bodyClassName="p-0">
          {users.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No admin users"
                hint="Add the first owner directly in admin_users, then invite others here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="hidden sm:table-cell">Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="font-medium">{u.displayName}</span>
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </TableCell>
                    <TableCell>
                      {isOwner && db ? (
                        <ActionForm
                          action={`/api/admin/users/${u.id}`}
                          method="PATCH"
                          submitLabel="Set"
                          variant="ghost"
                          size="xs"
                          inline
                          successMessage="Role saved."
                        >
                          <select
                            name="role"
                            defaultValue={u.role}
                            className={selectClass}
                            aria-label={`Role for ${u.displayName}`}
                          >
                            {ADMIN_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {roleLabel(r)}
                              </option>
                            ))}
                          </select>
                        </ActionForm>
                      ) : (
                        roleLabel(u.role)
                      )}
                    </TableCell>
                    <TableCell>
                      {isOwner && db && u.id !== session.adminUser.id ? (
                        <ActionForm
                          action={`/api/admin/users/${u.id}`}
                          method="PATCH"
                          payload={{ isActive: !u.isActive }}
                          submitLabel={u.isActive ? "Deactivate" : "Activate"}
                          variant="ghost"
                          size="xs"
                          inline
                          confirm={
                            u.isActive
                              ? `Deactivate ${u.displayName}? They lose access immediately.`
                              : undefined
                          }
                          successMessage="Saved."
                        />
                      ) : (
                        <BoolBadge value={u.isActive} on="Active" off="Inactive" />
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {fmtDate(u.createdAt, settings.timezone)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
        <Panel
          title="Invite by email"
          description="Sends a Supabase Auth invitation; the person sets a password from the email and lands in /admin with the chosen role."
        >
          <ActionForm
            action="/api/admin/users"
            submitLabel="Send invitation"
            disabled={!canInvite}
            successMessage="Invitation sent."
          >
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" required />
            </Field>
            <Field label="Display name" htmlFor="displayName">
              <Input id="displayName" name="displayName" required minLength={2} />
            </Field>
            <Field label="Role" htmlFor="role">
              <select
                id="role"
                name="role"
                defaultValue="editor"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
              >
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </Field>
          </ActionForm>
          {!isOwner ? (
            <p className="mt-3 text-xs text-muted-foreground">Owners only.</p>
          ) : !isStorageConfigured() ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Needs SUPABASE_SERVICE_ROLE_KEY for the Auth admin API.
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
