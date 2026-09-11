/**
 * `?page=` pagination for admin tables. Links only; every other search param is preserved.
 */
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildHref, type SearchParams } from "../filters/search-params";

export const PAGE_SIZE = 25;

export function TablePagination({
  pathname,
  current,
  page,
  pageSize = PAGE_SIZE,
  total,
  label = "rows",
}: {
  pathname: string;
  current: SearchParams;
  page: number;
  pageSize?: number;
  /** Total row count when known; otherwise pass `undefined` with `hasMore`. */
  total?: number;
  label?: string;
}) {
  const pages = total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const hasPrev = page > 1;
  const hasNext = pages !== undefined ? page < pages : true;
  const start = (page - 1) * pageSize + 1;
  const end = total !== undefined ? Math.min(total, page * pageSize) : page * pageSize;
  if (total === 0) return null;
  return (
    <nav
      aria-label="Table pagination"
      className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
    >
      <span>
        {total !== undefined
          ? `${start.toLocaleString("en")}–${end.toLocaleString("en")} of ${total.toLocaleString("en")} ${label}`
          : `Page ${page}`}
      </span>
      <span className="flex items-center gap-1">
        <PageLink
          href={buildHref(pathname, current, { page: page - 1 <= 1 ? undefined : page - 1 })}
          disabled={!hasPrev}
          label="Previous page"
        >
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </PageLink>
        <span className="px-2 tabular-nums">
          {page}
          {pages !== undefined ? ` / ${pages}` : ""}
        </span>
        <PageLink
          href={buildHref(pathname, current, { page: page + 1 })}
          disabled={!hasNext}
          label="Next page"
        >
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </PageLink>
      </span>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = cn(
    buttonVariants({ variant: "outline", size: "icon-sm" }),
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
