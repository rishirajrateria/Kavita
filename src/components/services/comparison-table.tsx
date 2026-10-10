import Link from "next/link";
import { hubHouseFor } from "@/components/content";
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
const CELL =
  "px-3 py-4 align-top font-sans text-[0.95rem] leading-relaxed whitespace-normal max-sm:min-w-0 max-sm:p-0 max-sm:text-[0.9rem] max-sm:leading-snug";

/**
 * Below 640 px the five columns become one compact entry per service: the name across the full
 * width, then lead and duration side by side on one line, then "best for" and "what to prepare",
 * each with its column name run in before the value (`data-label`, Cinzel caption type) rather
 * than set as a block label above it. Page-local, so the shared `.plate-stack` rule is not used.
 */
const STACK =
  "max-sm:[&_thead]:sr-only max-sm:[&_tr]:block max-sm:[&_tr]:py-4 max-sm:[&_td]:before:mr-2 max-sm:[&_td]:before:font-display max-sm:[&_td]:before:text-[0.62rem] max-sm:[&_td]:before:font-semibold max-sm:[&_td]:before:tracking-[0.2em] max-sm:[&_td]:before:text-accent-strong max-sm:[&_td]:before:uppercase max-sm:[&_td]:before:content-[attr(data-label)]";
const PAIR = "max-sm:inline-block max-sm:pt-1.5 max-sm:pr-5";
const RUN = "max-sm:block max-sm:pt-1.5";

/**
 * Every active service compared: lead, duration, best for, what to prepare (CLAUDE.md §9.4), in
 * the engraved table voice — Cinzel column heads over a gold hairline, a Cormorant row header
 * that is the service's link with its house's planet beside it (from `HUB`, never by hand),
 * hairline row rules, no box. Every `<td>` carries `data-label`, and
 * on a phone the rows become compact run-in entries (`STACK` below).
 */
export function ServicesComparisonTable({ services }: { services: Service[] }) {
  const [, lead, duration, bestFor, prepare] = SERVICES_COMPARISON.columns;
  return (
    <Table className={`text-base ${STACK}`}>
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
          const planet = hubHouseFor(`/services/${s.slug}`)?.planet;
          return (
            <TableRow key={s.slug} className="hover:bg-transparent">
              <th
                scope="row"
                className="min-w-[11rem] py-4 pr-5 text-left align-top font-serif text-lg leading-snug font-normal max-sm:block max-sm:min-w-0 max-sm:p-0"
              >
                <Link
                  href={`/services/${s.slug}`}
                  className="flex items-start gap-3 text-foreground no-underline hover:text-accent-strong"
                >
                  {planet ? (
                    // eslint-disable-next-line @next/next/no-img-element -- an animated SVG drawing with its own <style>, as the doors use
                    <img
                      src={`/planets/${planet}.svg`}
                      width={24}
                      height={24}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="mt-0.5 size-6 shrink-0"
                    />
                  ) : null}
                  <span>{s.name}</span>
                </Link>
              </th>
              <TableCell
                className={`${CELL} ${PAIR} whitespace-nowrap text-muted-foreground`}
                data-label={lead}
              >
                {LEAD_LABEL[s.lead]}
              </TableCell>
              <TableCell className={`${CELL} ${PAIR} whitespace-nowrap`} data-label={duration}>
                {s.durationMinutes} min
              </TableCell>
              <TableCell className={`${CELL} ${RUN} min-w-[13rem]`} data-label={bestFor}>
                {extra?.bestFor ?? s.shortDescription}
              </TableCell>
              <TableCell className={`${CELL} ${RUN} min-w-[13rem]`} data-label={prepare}>
                {extra?.prepare ?? s.whatToPrepare.join("; ")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
