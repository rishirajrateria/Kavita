import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fixtureDetail } from "@/components/admin/manage/booking-fixture";
import { BookingDetailView } from "@/components/admin/manage/booking-detail-view";
import { PageHeader } from "@/components/admin/manage/page-header";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Booking preview" };
export const dynamic = "force-dynamic";

/**
 * Design preview of the booking detail from a static, fictional fixture. Development only:
 * production answers 404. Actions are rendered disabled because nothing here is real.
 */
export default async function BookingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const session = await requireAdmin();
  const detail = fixtureDetail();
  return (
    <>
      <PageHeader
        eyebrow="Design preview · fictional data"
        title={detail.relations.client.fullName}
        description={`${detail.relations.service.name} · this page never exists in production.`}
      />
      <BookingDetailView detail={detail} role={session.adminUser.role} offline />
    </>
  );
}
