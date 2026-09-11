import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { fixtureRows } from "@/components/admin/manage/booking-fixture";
import { fmtTime } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { OfflineNote } from "@/components/admin/manage/panel";
import { BOOKINGS_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Button } from "@/components/ui/button";
import { listBookingsInRange, type BookingListRow } from "@/lib/admin/bookings";
import {
  addDays,
  gridRange,
  localDate,
  monthGrid,
  monthLabel,
  shiftMonth,
  weekGrid,
  type CalendarDay,
} from "@/lib/admin/calendar";
import { getSiteSettings } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-success",
  paid: "bg-success",
  pending: "bg-warning",
  awaiting_payment: "bg-warning",
  payment_pending_offline: "bg-info",
  completed: "bg-accent-strong",
  cancelled: "bg-error",
  no_show: "bg-error",
  rescheduled: "bg-muted-foreground",
};

export default async function CalendarPage({
  searchParams,
}: PageProps<"/admin/bookings/calendar">) {
  const params = await searchParams;
  const settings = await getSiteSettings();
  const tz = settings.timezone;
  const view = params.view === "week" ? "week" : "month";
  const today = localDate(new Date(), tz);
  const rawDate = typeof params.date === "string" ? params.date : today;
  const date = /^\d{4}-\d{2}(-\d{2})?$/.test(rawDate)
    ? rawDate.length === 7
      ? `${rawDate}-01`
      : rawDate
    : today;
  const weeks = view === "week" ? [weekGrid(date, tz)] : monthGrid(date, tz);
  const days = weeks.flat();
  const { from, to } = gridRange(days);
  const db = getDb();
  const rows: BookingListRow[] = db
    ? await listBookingsInRange(db, from, to)
    : process.env.NODE_ENV !== "production"
      ? fixtureRows().filter((r) => r.booking.startsAt >= from && r.booking.startsAt <= to)
      : [];
  const byDay = new Map<string, BookingListRow[]>();
  for (const r of rows) {
    const key = localDate(r.booking.startsAt, tz);
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }
  const prev = view === "week" ? addDays(days[0]!.date, -7) : shiftMonth(date, -1);
  const next = view === "week" ? addDays(days[0]!.date, 7) : shiftMonth(date, 1);
  const href = (d: string, v: string) => `/admin/bookings/calendar?view=${v}&date=${d}`;
  const title =
    view === "week"
      ? `Week of ${new Date(`${days[0]!.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`
      : monthLabel(date);

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="Calendar"
        description={`Sessions in ${tz}. Colour marks the status; open a day's entry to act on it.`}
        actions={
          <>
            <Button asChild variant={view === "month" ? "default" : "outline"} size="sm">
              <Link href={href(date, "month")}>Month</Link>
            </Button>
            <Button asChild variant={view === "week" ? "default" : "outline"} size="sm">
              <Link href={href(date, "week")}>Week</Link>
            </Button>
          </>
        }
      />
      <SubNav items={BOOKINGS_NAV} current="/admin/bookings/calendar" label="Bookings views" />
      {!db ? <OfflineNote what="Real bookings" /> : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={href(prev, view)} aria-label="Previous">
            ← Previous
          </Link>
        </Button>
        <h2 className="order-first w-full text-center font-serif text-xl font-medium tracking-tight sm:order-none sm:w-auto">
          {title}
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={href(next, view)} aria-label="Next">
            Next →
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-accent-border/40 bg-card shadow-xs">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
          <thead>
            <tr>
              {DAY_NAMES.map((d) => (
                <th
                  key={d}
                  scope="col"
                  className="border-b border-border px-2 py-2 text-left text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi} className="align-top">
                {week.map((day) => (
                  <DayCell
                    key={day.date}
                    day={day}
                    rows={byDay.get(day.date) ?? []}
                    tz={tz}
                    tall={view === "week"}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Today is {today} in {tz}. Jump to{" "}
        <Link href={href(today, view)} className="text-accent-strong">
          today
        </Link>
        .
      </p>
    </>
  );
}

function DayCell({
  day,
  rows,
  tz,
  tall,
}: {
  day: CalendarDay;
  rows: BookingListRow[];
  tz: string;
  tall: boolean;
}) {
  return (
    <td
      className={cn(
        "border-r border-b border-border/70 p-1.5 last:border-r-0",
        tall ? "h-[28rem]" : "h-28",
        !day.inMonth && "bg-muted/30 text-muted-foreground",
        day.isToday && "bg-accent/40",
      )}
    >
      <p className={cn("mb-1 text-xs font-medium", day.isToday && "text-accent-strong")}>
        {Number(day.date.slice(-2))}
        {day.isToday ? <span className="sr-only"> (today)</span> : null}
      </p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.booking.id}>
            <Link
              href={`/admin/bookings/${r.booking.id}`}
              className="flex items-center gap-1.5 rounded-md bg-background/80 px-1.5 py-1 text-xs no-underline ring-1 ring-border/60 hover:ring-accent-border"
              title={`${r.clientName} · ${r.serviceName} · ${r.booking.status}`}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  STATUS_DOT[r.booking.status] ?? "bg-muted-foreground",
                )}
              />
              <span className="font-medium tabular-nums">{fmtTime(r.booking.startsAt, tz)}</span>
              <span className="truncate">{r.clientName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </td>
  );
}
