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

function Chip({ active, to, children }: { active: boolean; to: string; children: string }) {
  return (
    <li>
      <Link
        href={to}
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm no-underline transition-colors",
          active
            ? "border-accent-border bg-accent text-accent-foreground"
            : "border-border text-muted-foreground hover:border-accent-border hover:text-foreground",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

/** Filter chips as plain links with search params — server-handled, no JavaScript. */
export function TestimonialFilters({
  services,
  regions,
  activeService,
  activeRegion,
}: TestimonialFiltersProps) {
  const f = TESTIMONIALS_LIST.filters;
  return (
    <nav aria-label="Filter experiences" className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-sans text-xs font-semibold tracking-[0.12em] text-accent-strong uppercase">
          {f.serviceLabel}
        </span>
        <ul className="flex flex-wrap gap-2">
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-sans text-xs font-semibold tracking-[0.12em] text-accent-strong uppercase">
          {f.regionLabel}
        </span>
        <ul className="flex flex-wrap gap-2">
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
