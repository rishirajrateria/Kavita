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
 * One row of chips: wrapped and centred from `sm`; on a phone a single line that scrolls
 * sideways inside its own box, so ten service names never stack into a column.
 */
const ROW =
  "-mx-4 flex flex-nowrap justify-start gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&>li]:shrink-0";

function Chip({ active, to, children }: { active: boolean; to: string; children: string }) {
  return (
    <li>
      <Link
        href={to}
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex min-h-9 items-center rounded-full border px-3.5 font-sans text-[0.8rem] no-underline transition-colors duration-(--duration-base)",
          active
            ? "border-accent-strong/70 text-accent-strong"
            : "border-accent-border/30 text-muted-foreground hover:border-accent-border hover:text-foreground",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * Filter chips as plain links with search params — server-handled, no JavaScript. Set as two
 * centred rows of hairline chips under Cinzel captions; the active chip is drawn in brass.
 */
export function TestimonialFilters({
  services,
  regions,
  activeService,
  activeRegion,
}: TestimonialFiltersProps) {
  const f = TESTIMONIALS_LIST.filters;
  return (
    <nav aria-label="Filter experiences" className="space-y-6 text-center">
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
