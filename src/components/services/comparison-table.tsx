import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPARISON_EXTRA, LEAD_LABEL, SERVICES_COMPARISON } from "@/content/pages/services";
import type { Service } from "@/lib/data";

/** Every active service compared: lead, duration, best for, what to prepare (CLAUDE.md §9.4). */
export function ServicesComparisonTable({ services }: { services: Service[] }) {
  return (
    <Table
      containerClassName="rounded-xl border border-t-2 border-t-accent-border shadow-sm"
      className="text-base"
    >
      <TableCaption className="px-4 pb-4 text-left">{SERVICES_COMPARISON.caption}</TableCaption>
      <TableHeader>
        <TableRow className="border-b-2 hover:bg-transparent">
          {SERVICES_COMPARISON.columns.map((col) => (
            <TableHead
              key={col}
              scope="col"
              className="h-auto px-5 py-4 font-sans text-xs font-semibold tracking-[0.12em] whitespace-normal text-accent-strong uppercase"
            >
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((s) => {
          const extra = COMPARISON_EXTRA[s.slug];
          return (
            <TableRow key={s.slug} className="even:bg-surface-muted/40 hover:bg-transparent">
              <th scope="row" className="min-w-[12rem] px-5 py-4 text-left align-top font-medium">
                <Link href={`/services/${s.slug}`} className="font-serif text-lg text-foreground">
                  {s.name}
                </Link>
              </th>
              <TableCell className="px-5 py-4 align-top whitespace-nowrap text-muted-foreground">
                {LEAD_LABEL[s.lead]}
              </TableCell>
              <TableCell className="px-5 py-4 align-top whitespace-nowrap">
                {s.durationMinutes} min
              </TableCell>
              <TableCell className="min-w-[14rem] px-5 py-4 align-top leading-relaxed whitespace-normal">
                {extra?.bestFor ?? s.shortDescription}
              </TableCell>
              <TableCell className="min-w-[14rem] px-5 py-4 align-top leading-relaxed whitespace-normal">
                {extra?.prepare ?? s.whatToPrepare.join("; ")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
