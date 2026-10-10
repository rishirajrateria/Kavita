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

const HEAD =
  "h-auto px-3 py-3 align-bottom font-display text-[0.62rem] font-semibold tracking-[0.22em] whitespace-normal text-accent-strong uppercase first:pl-0 last:pr-0";
const CELL = "px-3 py-4 align-top font-sans text-[0.95rem] leading-relaxed whitespace-normal";

/**
 * Every active service compared: lead, duration, best for, what to prepare (CLAUDE.md §9.4), in
 * the engraved table voice — Cinzel column heads over a gold hairline, a Cormorant row header
 * that is the service's link, hairline row rules, no box. Every `<td>` carries `data-label`, and
 * the table takes `.plate-stack` so its five columns stack on a phone (src/styles/scene.css).
 */
export function ServicesComparisonTable({ services }: { services: Service[] }) {
  const [, lead, duration, bestFor, prepare] = SERVICES_COMPARISON.columns;
  return (
    <Table className="plate-stack text-base">
      <TableCaption className="px-0 pb-4 text-left font-sans text-sm text-muted-foreground">
        {SERVICES_COMPARISON.caption}
      </TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {SERVICES_COMPARISON.columns.map((col) => (
            <TableHead key={col} scope="col" className={HEAD}>
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((s) => {
          const extra = COMPARISON_EXTRA[s.slug];
          return (
            <TableRow key={s.slug} className="hover:bg-transparent">
              <th
                scope="row"
                className="min-w-[11rem] py-4 pr-5 text-left align-top font-serif text-lg leading-snug font-normal"
              >
                <Link
                  href={`/services/${s.slug}`}
                  className="text-foreground no-underline hover:text-accent-strong"
                >
                  {s.name}
                </Link>
              </th>
              <TableCell
                className={`${CELL} whitespace-nowrap text-muted-foreground`}
                data-label={lead}
              >
                {LEAD_LABEL[s.lead]}
              </TableCell>
              <TableCell className={`${CELL} whitespace-nowrap`} data-label={duration}>
                {s.durationMinutes} min
              </TableCell>
              <TableCell className={`${CELL} min-w-[13rem]`} data-label={bestFor}>
                {extra?.bestFor ?? s.shortDescription}
              </TableCell>
              <TableCell className={`${CELL} min-w-[13rem]`} data-label={prepare}>
                {extra?.prepare ?? s.whatToPrepare.join("; ")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
