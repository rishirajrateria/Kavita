import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { money } from "@/components/admin/manage/format";
import { PageHeader } from "@/components/admin/manage/page-header";
import { OfflineNote } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { CONTENT_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listServicesAdmin } from "@/lib/admin/content";

export const metadata: Metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const db = getDb();
  const services = await listServicesAdmin(db);
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Services"
        description="Names, durations, buffers, prices per currency and the copy each service page renders. Each service states whether it is astrology-led, vastu-led or integrated."
      />
      <SubNav items={CONTENT_NAV} current="/admin/content/services" label="Content sections" />
      {!db ? <OfflineNote /> : null}
      <Table containerClassName="rounded-lg border border-border">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Service</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="hidden md:table-cell">Buffers</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s, i) => (
            <TableRow key={s.id} className={i % 2 ? "bg-muted/20" : undefined}>
              <TableCell>
                <Link
                  href={`/admin/content/services/${s.id}`}
                  className="font-medium no-underline hover:underline"
                >
                  {s.name}
                </Link>
                <span className="block text-xs text-muted-foreground">/services/{s.slug}</span>
              </TableCell>
              <TableCell>
                <Badge variant="caps">{s.lead}</Badge>
              </TableCell>
              <TableCell>{s.durationMinutes} min</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {s.bufferBeforeMinutes} / {s.bufferAfterMinutes} min
              </TableCell>
              <TableCell>
                {s.priceMinor && s.currency ? (
                  money(s.priceMinor, s.currency)
                ) : (
                  <span className="text-muted-foreground">{s.priceNote ?? "on request"}</span>
                )}
                {Object.keys(s.prices).length ? (
                  <span className="block text-xs text-muted-foreground">
                    {Object.entries(s.prices)
                      .map(([c, v]) => money(v, c))
                      .join(" · ")}
                  </span>
                ) : null}
              </TableCell>
              <TableCell>
                <BoolBadge value={s.isActive} on="Active" off="Hidden" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
