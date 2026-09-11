import Link from "next/link";
import type { BookingListRow } from "@/lib/admin/bookings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./panel";
import { BookingStatusBadge } from "./status-badge";
import { MODE_LABEL, bookingRef, fmtDateTime, fmtTime } from "./format";

export function BookingsTable({ rows, timezone }: { rows: BookingListRow[]; timezone: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState title="No bookings match" hint="Try a wider date range or clear the filters." />
    );
  }
  return (
    <Table containerClassName="rounded-lg border border-border">
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>When ({timezone})</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Service</TableHead>
          <TableHead className="hidden md:table-cell">Client&apos;s local time</TableHead>
          <TableHead className="hidden lg:table-cell">Mode</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ref</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.booking.id} className={i % 2 ? "bg-muted/20" : undefined}>
            <TableCell className="font-medium">
              <Link
                href={`/admin/bookings/${r.booking.id}`}
                className="no-underline hover:underline"
              >
                {fmtDateTime(r.booking.startsAt, timezone)}
              </Link>
            </TableCell>
            <TableCell>
              <span className="block max-w-[14rem] truncate">{r.clientName}</span>
              <span className="block max-w-[14rem] truncate text-xs text-muted-foreground">
                {r.clientEmail}
              </span>
            </TableCell>
            <TableCell className="max-w-[12rem] truncate">{r.serviceName}</TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {fmtTime(r.booking.startsAt, r.booking.clientTimezone)} {r.booking.clientTimezone}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{MODE_LABEL[r.booking.mode]}</TableCell>
            <TableCell>
              <BookingStatusBadge status={r.booking.status} />
            </TableCell>
            <TableCell className="text-right font-mono text-xs text-muted-foreground">
              {bookingRef(r.booking.id)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
