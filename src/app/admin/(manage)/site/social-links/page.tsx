import type { Metadata } from "next";
import { getDb } from "@/db";
import { PageHeader } from "@/components/admin/manage/page-header";
import { OfflineNote } from "@/components/admin/manage/panel";
import { SocialLinksManager } from "@/components/admin/manage/social-links-manager";
import { SITE_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { getAdminSession } from "@/lib/admin/auth";
import { listAllSocialLinks } from "@/lib/admin/social";

export const metadata: Metadata = { title: "Social links" };
export const dynamic = "force-dynamic";

export default async function SocialLinksPage() {
  const db = getDb();
  const [links, session] = await Promise.all([listAllSocialLinks(db), getAdminSession()]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);
  return (
    <>
      <PageHeader
        eyebrow="Site"
        title="Social links"
        description="Profiles shown in the footer (and optionally the header) and emitted as sameAs on the Person and ProfessionalService schema — an SEO feature, not decoration (CLAUDE.md §13.A). URLs are validated per platform."
      />
      <SubNav items={SITE_NAV} current="/admin/site/social-links" label="Site sections" />
      {!db ? <OfflineNote what="Link changes" /> : null}
      <SocialLinksManager initial={links} disabled={!canEdit} />
    </>
  );
}
