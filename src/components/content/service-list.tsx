import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import type { Service, ServiceLead } from "@/lib/data/types";

const LEAD_LABEL: Record<ServiceLead, string> = {
  astrology: "Astrology-led",
  vastu: "Vastu-led",
  integrated: "Integrated",
};

/**
 * Compact cards linking to `/services/[slug]` — name, lead badge (astrology / vastu /
 * integrated, CLAUDE.md §1), duration and the short description. Data only; nothing typed here.
 */
export function ServiceList({
  services,
  allLink = { label: "All services", href: "/services" },
}: {
  services: Service[];
  allLink?: { label: string; href: string } | null;
}) {
  if (services.length === 0) return null;
  return (
    <div className="space-y-8">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <li
            key={s.slug}
            className="group/card relative flex flex-col gap-3 rounded-2xl border border-accent-border/30 bg-card p-6 text-card-foreground transition-colors hover:border-accent-border"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="caps">{LEAD_LABEL[s.lead]}</Badge>
              <span className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {s.durationMinutes} min
              </span>
            </div>
            <Heading as="h3" level={4}>
              <Link
                href={`/services/${s.slug}`}
                className="no-underline after:absolute after:inset-0 after:rounded-2xl hover:text-accent-strong"
              >
                {s.name}
              </Link>
            </Heading>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.shortDescription}</p>
            <span
              aria-hidden="true"
              className="mt-auto pt-2 font-serif text-accent-strong transition-transform group-hover/card:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </li>
        ))}
      </ul>
      {allLink ? (
        <Button asChild variant="link" className="px-0">
          <Link href={allLink.href}>{allLink.label} →</Link>
        </Button>
      ) : null}
    </div>
  );
}
