import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
 *
 * A repeating grid, so these are `quiet` cards: a hairline and air rather than a fill, lifting
 * 2px on hover. The whole tile is the link (the title's `after:inset-0` overlay).
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
          <Card
            key={s.slug}
            as="li"
            variant="quiet"
            interactive
            className="group/card gap-4 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50"
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
                className="no-underline transition-colors duration-(--duration-base) after:absolute after:inset-0 after:rounded-2xl hover:text-accent-strong focus-visible:outline-none"
              >
                {s.name}
              </Link>
            </Heading>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.shortDescription}</p>
            <span
              aria-hidden="true"
              className="mt-auto pt-2 font-serif text-accent-strong transition-transform duration-(--duration-base) ease-emphasized group-hover/card:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </Card>
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
