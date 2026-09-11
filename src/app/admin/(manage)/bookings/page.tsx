import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { BOOKING_STATUSES } from "@/db/schema";
import { BookingsTable } from "@/components/admin/manage/bookings-table";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Panel } from "@/components/admin/manage/panel";
import { BOOKINGS_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { bookingStatusLabel } from "@/components/admin/manage/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  bookingServiceOptions,
  bookingStatusCounts,
  listBookings,
  type BookingList,
} from "@/lib/admin/bookings";
import { bookingListQuerySchema } from "@/lib/admin/manage-schemas";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const params = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = bookingListQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : bookingListQuerySchema.parse({});
  const db = getDb();
  const settings = await getSiteSettings();
  const [list, services, counts] = db
    ? await Promise.all([
        listBookings(db, query, settings),
        bookingServiceOptions(db),
        bookingStatusCounts(db),
      ])
    : [null, [], {}];
  const exportQs = new URLSearchParams(
    Object.entries(flat).filter(
      (e): e is [string, string] => typeof e[1] === "string" && e[1] !== "",
    ),
  );

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="Bookings"
        description={`All consultations, shown in ${settings.timezone}. Filter, open a booking to act on it, or export the current view.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/admin/bookings?format=csv&${exportQs}`}>Export CSV</a>
            </Button>
            <Button asChild variant="gold-outline" size="sm">
              <a href={`/api/admin/bookings?format=ics&${exportQs}`}>Calendar (.ics)</a>
            </Button>
          </>
        }
      />
      <SubNav items={BOOKINGS_NAV} current="/admin/bookings" label="Bookings views" />

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Status counts">
        {BOOKING_STATUSES.filter((s) => (counts[s] ?? 0) > 0 || s === query.status).map((s) => (
          <a
            key={s}
            href={`/admin/bookings?${new URLSearchParams({ ...Object.fromEntries(exportQs), status: s, page: "1" })}`}
            aria-current={query.status === s ? "page" : undefined}
            className="rounded-full border border-border px-3 py-1 text-xs no-underline hover:border-accent-border aria-[current=page]:border-accent-strong aria-[current=page]:bg-accent"
          >
            {bookingStatusLabel(s)} <span className="text-muted-foreground">{counts[s] ?? 0}</span>
          </a>
        ))}
      </div>

      <Panel className="mb-6" bodyClassName="py-4">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1 text-xs font-medium">
            Status
            <select name="status" defaultValue={query.status ?? ""} className={selectClass}>
              <option value="">Any</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {bookingStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Service
            <select name="service" defaultValue={query.service ?? ""} className={selectClass}>
              <option value="">Any</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            From
            <Input type="date" name="from" defaultValue={query.from ?? ""} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            To
            <Input type="date" name="to" defaultValue={query.to ?? ""} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Client or location
            <Input type="search" name="q" defaultValue={query.q ?? ""} placeholder="name, email" />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" variant="default" size="default">
              Filter
            </Button>
            <Button asChild variant="ghost" size="default">
              <Link href="/admin/bookings">Clear</Link>
            </Button>
          </div>
        </form>
      </Panel>

      {list ? (
        <>
          <BookingsTable rows={list.rows} timezone={settings.timezone} />
          <Pagination list={list} qs={exportQs} />
        </>
      ) : (
        <EmptyState
          title="Connect Supabase to see bookings"
          hint={
            <>
              Set <code>SUPABASE_DB_URL</code>; bookings created through the public form appear
              here. The{" "}
              <Link
                href="/admin/bookings/preview"
                className="text-accent-strong underline-offset-4 hover:underline"
              >
                design preview
              </Link>{" "}
              shows the layout with fictional data (development only).
            </>
          }
        />
      )}
    </>
  );
}

function Pagination({ list, qs }: { list: BookingList; qs: URLSearchParams }) {
  if (list.pageCount <= 1) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        {list.total} booking{list.total === 1 ? "" : "s"}
      </p>
    );
  }
  const link = (page: number) =>
    `/admin/bookings?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page) })}`;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        Page {list.page} of {list.pageCount} · {list.total} bookings
      </p>
      <div className="flex gap-2">
        {list.page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <a href={link(list.page - 1)}>Previous</a>
          </Button>
        ) : null}
        {list.page < list.pageCount ? (
          <Button asChild variant="outline" size="sm">
            <a href={link(list.page + 1)}>Next</a>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
