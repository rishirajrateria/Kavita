import Link from "next/link";
import { NorthIndianChart, VastuCompass } from "@/components/motifs";
import type { Service, ServiceLead } from "@/lib/data";
import { LeadBadge } from "./lead-badge";
import { servicePrice } from "./price";

/** Small gold glyph per lead type — the same as on the home page. */
export function LeadGlyph({ lead }: { lead: ServiceLead }) {
  const cls = "size-7 text-accent-strong";
  if (lead === "astrology") return <NorthIndianChart decorative className={cls} />;
  if (lead === "vastu") return <VastuCompass decorative hideLabels className={cls} />;
  return (
    <span className="flex items-center gap-1.5">
      <NorthIndianChart decorative className={cls} />
      <VastuCompass decorative hideLabels className={cls} />
    </span>
  );
}

/** One service: lead badge, name (stretched link), short description, duration and price. */
export function ServiceCard({
  service,
  headingLevel = 3,
}: {
  service: Service;
  headingLevel?: 2 | 3;
}) {
  const price = servicePrice(service);
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-xl border bg-background p-6 shadow-xs transition-[box-shadow,translate] duration-(--duration-base) ease-standard before:absolute before:top-0 before:left-0 before:h-0.5 before:w-6 before:bg-accent-border before:transition-[width] before:duration-(--duration-slow) before:ease-emphasized hover:-translate-y-0.5 hover:shadow-md hover:before:w-full motion-reduce:hover:translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <LeadGlyph lead={service.lead} />
        <LeadBadge lead={service.lead} />
      </div>
      <H className="font-serif text-xl leading-snug font-medium">
        <Link
          href={`/services/${service.slug}`}
          className="no-underline group-hover:text-accent-strong after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {service.name}
        </Link>
      </H>
      <p className="text-sm leading-relaxed text-muted-foreground">{service.shortDescription}</p>
      <dl className="mt-auto flex items-center justify-between gap-4 border-t border-accent-border/30 pt-4 text-sm">
        <div>
          <dt className="sr-only">Session length</dt>
          <dd className="text-muted-foreground">{service.durationMinutes} min</dd>
        </div>
        <div className="text-right">
          <dt className="sr-only">Price</dt>
          <dd
            className={price.placeholder ? "text-muted-foreground" : "font-medium text-foreground"}
            data-placeholder={price.placeholder ? "price" : undefined}
          >
            {price.text}
          </dd>
        </div>
      </dl>
    </article>
  );
}
