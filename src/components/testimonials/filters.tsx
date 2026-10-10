import Link from "next/link";
import { TESTIMONIALS_LIST } from "@/content/pages/testimonials";
import type { LocationRecord, Service } from "@/lib/data";
import { cn } from "@/lib/utils";

export interface TestimonialFiltersProps {
  services: Service[];
  regions: LocationRecord[];
  activeService?: string;
  activeRegion?: string;
}

function href(service?: string, region?: string): string {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (region) params.set("region", region);
  const q = params.toString();
  return q ? `/testimonials?${q}#experiences` : "/testimonials#experiences";
}

/** Cinzel caption type (SPEC §2.1): the ruled label above each row of chips. */
const LABEL =
  "block font-display text-[0.62rem] font-semibold tracking-[0.34em] text-accent-strong uppercase";

/**
 * One row of quiet text links with a 3 px brass dot in the gap before every item. The row
 * starts a gutter early (`-ms-4`, each item `ms-4`) and is clipped 5 px short of the column
 * edge, so the dot before whichever item opens a line falls outside the clip while that
 * item's focus ring (4 px out) stays inside it. From `sm` the row wraps; on a phone it stays
 * one line that scrolls sideways in its own box and fades at the right edge instead of
 * cutting a name hard at the gutter.
 */
const ROW =
  "-ms-4 -me-4 flex snap-x scroll-ps-4 flex-nowrap items-center overflow-x-auto pe-4 pb-1 [clip-path:inset(-0.5rem_-0.5rem_-0.5rem_calc(1rem-5px))] [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:me-0 sm:flex-wrap sm:overflow-visible sm:pe-0 sm:pb-0 sm:[mask-image:none]";

const ITEM =
  "relative ms-4 inline-flex shrink-0 snap-start items-center before:absolute before:-start-[calc(0.5rem+1.5px)] before:top-1/2 before:size-[3px] before:-translate-y-1/2 before:rounded-full before:bg-accent-strong/80 before:content-['']";

function Chip({ active, to, children }: { active: boolean; to: string; children: string }) {
  return (
    <li className={ITEM}>
      <Link
        href={to}
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex min-h-11 items-center px-1 font-sans text-[0.8rem] no-underline underline-offset-[6px] transition-colors duration-(--duration-base) sm:min-h-8",
          active
            ? "text-accent-strong underline decoration-accent-strong/70 decoration-1"
            : "text-muted-foreground hover:text-foreground hover:underline hover:decoration-accent-border hover:decoration-1",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * Filters as plain links with search params — server-handled, no JavaScript. Set as two rows
 * of quiet Karla links under Cinzel captions; the active item is brass with a hairline rule.
 */
export function TestimonialFilters({
  services,
  regions,
  activeService,
  activeRegion,
}: TestimonialFiltersProps) {
  const f = TESTIMONIALS_LIST.filters;
  return (
    <nav aria-label="Filter experiences" className="space-y-6">
      <div className="space-y-3">
        <span className={LABEL}>{f.serviceLabel}</span>
        <ul className={ROW}>
          <Chip active={!activeService} to={href(undefined, activeRegion)}>
            {f.all}
          </Chip>
          {services.map((s) => (
            <Chip key={s.slug} active={activeService === s.slug} to={href(s.slug, activeRegion)}>
              {s.name}
            </Chip>
          ))}
        </ul>
      </div>
      <div className="space-y-3">
        <span className={LABEL}>{f.regionLabel}</span>
        <ul className={ROW}>
          <Chip active={!activeRegion} to={href(activeService, undefined)}>
            {f.all}
          </Chip>
          {regions.map((r) => (
            <Chip key={r.slug} active={activeRegion === r.slug} to={href(activeService, r.slug)}>
              {r.name}
            </Chip>
          ))}
        </ul>
      </div>
      {activeService || activeRegion ? (
        <Link href="/testimonials#experiences" className="text-sm text-accent-strong">
          {f.clear}
        </Link>
      ) : null}
    </nav>
  );
}
