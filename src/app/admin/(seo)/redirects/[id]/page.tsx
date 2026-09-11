/** `/admin/redirects/[id]` — edit or delete one redirect rule. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { fmtDateTime } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { Fact, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { RedirectFields } from "@/components/admin/redirects/redirect-fields";
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";
import { checkChain, describeChain } from "@/lib/redirects/graph";
import { getRedirect, listRedirects } from "@/lib/redirects/store";

export const metadata: Metadata = { title: "Edit redirect" };
export const dynamic = "force-dynamic";

export default async function RedirectEditPage({ params }: PageProps<"/admin/redirects/[id]">) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    return (
      <>
        <PageHeader eyebrow="Search" title="Edit redirect" />
        <OfflineNote what="Redirects" />
      </>
    );
  }
  const [rule, all, settings, session] = await Promise.all([
    getRedirect(db, id),
    listRedirects(db),
    getSiteSettings(),
    getAdminSession(),
  ]);
  if (!rule) notFound();
  const canEdit = session?.adminUser.role !== "viewer";
  const check = checkChain(
    rule,
    all
      .filter((r) => r.isActive && r.id !== rule.id)
      .map((r) => ({
        id: r.id,
        fromPath: r.fromPath,
        toPath: r.toPath,
        matchType: r.matchType,
        statusCode: r.statusCode,
      })),
  );
  const warning = describeChain(check, rule.fromPath);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/redirects" className="no-underline hover:underline">
            ← Redirects
          </Link>
        }
        title={rule.fromPath}
        description={`${rule.statusCode} · ${rule.matchType} · created ${fmtDateTime(rule.createdAt, settings.timezone)}`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Rule">
          {warning ? (
            <p
              role="status"
              className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning"
            >
              {warning}
            </p>
          ) : null}
          <ActionForm
            action={`/api/admin/redirects/${rule.id}`}
            method="PATCH"
            submitLabel="Save redirect"
            disabled={!canEdit}
            redirectTo="/admin/redirects"
          >
            <RedirectFields values={rule} idPrefix="edit" />
          </ActionForm>
        </Panel>
        <Panel title="Activity">
          <dl className="divide-y divide-border/70">
            <Fact label="Hits">{rule.hitCount.toLocaleString("en")}</Fact>
            <Fact label="Last hit">
              {rule.lastHitAt ? fmtDateTime(rule.lastHitAt, settings.timezone) : "Never"}
            </Fact>
            <Fact label="Source">{rule.source.replace(/_/g, " ")}</Fact>
            <Fact label="Updated">{fmtDateTime(rule.updatedAt, settings.timezone)}</Fact>
          </dl>
          {canEdit ? (
            <div className="mt-4 border-t border-border/70 pt-4">
              <ActionForm
                action={`/api/admin/redirects/${rule.id}`}
                method="DELETE"
                inline
                variant="destructive"
                size="sm"
                submitLabel="Delete redirect"
                confirm={`Delete the redirect for ${rule.fromPath}? Visitors to that address will see a 404.`}
                redirectTo="/admin/redirects"
              />
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
