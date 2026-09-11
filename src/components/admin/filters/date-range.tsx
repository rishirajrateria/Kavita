/**
 * Date-range picker: the eight presets as links plus a custom `from`/`to` GET form. Server
 * component, zero JS — the browser's native date inputs do the picking. Every other filter is
 * carried through hidden inputs.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildHref,
  carriedParams,
  RANGE_LABELS,
  RANGE_PRESETS,
  type PanelParams,
  type SearchParams,
} from "./search-params";

export function DateRange({
  pathname,
  current,
  params,
}: {
  pathname: string;
  current: SearchParams;
  params: PanelParams;
}) {
  const { range } = params;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="flex flex-wrap gap-1" aria-label="Date range">
        {RANGE_PRESETS.filter((p) => p !== "custom").map((preset) => {
          const active = range.preset === preset;
          return (
            <li key={preset}>
              <Link
                href={buildHref(pathname, current, {
                  range: preset,
                  from: undefined,
                  to: undefined,
                  page: undefined,
                })}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium no-underline transition-colors",
                  active
                    ? "border-accent-border bg-accent text-accent-foreground"
                    : "border-border text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                {RANGE_LABELS[preset]}
              </Link>
            </li>
          );
        })}
      </ul>
      <form method="get" action={pathname} className="flex flex-wrap items-center gap-1.5">
        {carriedParams(current, ["range", "from", "to", "page"]).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="range" value="custom" />
        <label className="sr-only" htmlFor="range-from">
          From
        </label>
        <input
          id="range-from"
          type="date"
          name="from"
          defaultValue={range.from}
          max={range.to}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <label className="sr-only" htmlFor="range-to">
          To
        </label>
        <input
          id="range-to"
          type="date"
          name="to"
          defaultValue={range.to}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        />
        <Button type="submit" variant={range.preset === "custom" ? "gold" : "outline"} size="sm">
          Apply
        </Button>
      </form>
    </div>
  );
}
