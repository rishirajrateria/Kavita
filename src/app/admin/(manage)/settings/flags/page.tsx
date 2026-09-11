import type { Metadata } from "next";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { OfflineNote, Panel } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { SETTINGS_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { requireAdmin } from "@/lib/admin/auth";
import { listFlags } from "@/lib/admin/settings";

export const metadata: Metadata = { title: "Feature flags" };
export const dynamic = "force-dynamic";

export default async function FlagsPage() {
  const db = getDb();
  const [session, flags] = await Promise.all([requireAdmin(), listFlags(db)]);
  const canEdit = session.adminUser.role === "owner" && Boolean(db);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Feature flags"
        description="A database value wins; otherwise the environment variable of the same name; otherwise off. Owners only."
      />
      <SubNav items={SETTINGS_NAV} current="/admin/settings/flags" label="Settings sections" />
      {!db ? <OfflineNote what="Flag changes" /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {flags.map((f) => {
          const on = f.value === true;
          return (
            <Panel
              key={f.key}
              title={f.key
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/^\w/, (c) => c.toUpperCase())}
              description={f.description ?? undefined}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <BoolBadge value={on} on="On" off="Off" />
                  <span className="text-xs text-muted-foreground">from {f.source}</span>
                </div>
                <ActionForm
                  action="/api/admin/flags"
                  method="PUT"
                  payload={{ key: f.key, value: !on }}
                  submitLabel={on ? "Turn off" : "Turn on"}
                  variant={on ? "outline" : "gold"}
                  size="sm"
                  inline
                  disabled={!canEdit}
                  confirm={
                    f.key === "PAYMENTS_ENABLED" && !on
                      ? "Enable online payments? Make sure a gateway is configured first (CLAUDE.md §11)."
                      : undefined
                  }
                  successMessage="Flag saved."
                />
                <code className="text-[0.68rem] text-muted-foreground">{f.key}</code>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
