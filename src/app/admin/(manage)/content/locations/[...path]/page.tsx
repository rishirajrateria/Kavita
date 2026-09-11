import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { PageHeader } from "@/components/admin/manage/page-header";
import { Panel } from "@/components/admin/manage/panel";
import { ResearchForm } from "@/components/admin/manage/research-form";
import { ResearchStatusBadge } from "@/components/admin/manage/status-badge";
import { getLocationAdmin } from "@/lib/admin/content";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Location" };
export const dynamic = "force-dynamic";

export default async function LocationEditPage({
  params,
}: PageProps<"/admin/content/locations/[...path]">) {
  const { path: segments } = await params;
  const path = segments.join("/");
  const session = await requireAdmin();
  const db = getDb();
  const found = await getLocationAdmin(db, path);
  if (!found) notFound();
  const { record, row } = found;
  const editable = session.adminUser.role !== "viewer" && Boolean(row);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/content/locations" className="no-underline hover:underline">
            ← Locations
          </Link>
        }
        title={record.name}
        description={
          <>
            <span className="capitalize">{record.type}</span> · {record.path} · {record.timezone} ·{" "}
            <Link href={`/astrologer/${record.path}`} className="text-accent-strong">
              astrologer page
            </Link>{" "}
            ·{" "}
            <Link href={`/vastu-consultant/${record.path}`} className="text-accent-strong">
              vastu page
            </Link>
          </>
        }
        actions={<ResearchStatusBadge status={record.researchStatus} />}
      />
      <Panel className="mb-6" bodyClassName="py-3">
        <p className="text-xs text-muted-foreground">
          {row
            ? "This row lives in the database and overrides the repository file for the live site. Saving re-derives the status: every field within its limits = partial; plus 2–3 practitioner-supplied client concerns = complete."
            : "Not connected to Supabase: this is the repository research file, read-only here. Once connected (and seeded with pnpm db:seed), the database row becomes authoritative and editable on this screen."}
        </p>
      </Panel>
      <ResearchForm
        path={record.path}
        initial={record.research ?? null}
        contentUpdatedAt={record.contentUpdatedAt}
        isFeatured={Boolean(record.isFeatured)}
        disabled={!editable}
      />
    </>
  );
}
