import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { BookingDetailView } from "@/components/admin/manage/booking-detail-view";
import { bookingRef } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState } from "@/components/admin/manage/panel";
import { requireAdmin } from "@/lib/admin/auth";
import { getBookingDetail } from "@/lib/admin/bookings";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BookingDetailPage({ params }: PageProps<"/admin/bookings/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const session = await requireAdmin();
  const db = getDb();
  const settings = await getSiteSettings();
  const detail = db ? await getBookingDetail(db, id, session.adminUser.role, { settings }) : null;
  if (db && !detail) notFound();

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/bookings" className="no-underline hover:underline">
            ← Bookings
          </Link>
        }
        title={detail ? `${detail.relations.client.fullName}` : "Booking"}
        description={
          detail ? `${detail.relations.service.name} · reference ${bookingRef(id)}` : undefined
        }
      />
      {detail ? (
        <BookingDetailView detail={detail} role={session.adminUser.role} />
      ) : (
        <EmptyState
          title="Connect Supabase to open bookings"
          hint="Set SUPABASE_DB_URL to load this booking."
        />
      )}
    </>
  );
}
