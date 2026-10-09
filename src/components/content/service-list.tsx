import Link from "next/link";
import type { Service, ServiceLead } from "@/lib/data/types";
import { DoorField } from "./doors";

const LEAD_LABEL: Record<ServiceLead, string> = {
  astrology: "Astrology-led",
  vastu: "Vastu-led",
  integrated: "Integrated",
};

/**
 * The services as doors (SPEC §2.3): one HTML `<a>` per `/services/[slug]`, its planet derived
 * from the hub house that opens it, the short description as the visible line and
 * `{lead} · {minutes} min` as the meta. Data only; nothing typed here.
 */
export function ServiceList({
  services,
  allLink = { label: "All services", href: "/services" },
  columns = 3,
}: {
  services: Service[];
  allLink?: { label: string; href: string } | null;
  columns?: 2 | 3 | 4;
}) {
  if (services.length === 0) return null;
  return (
    <div className="space-y-8">
      <DoorField
        columns={columns}
        doors={services.map((s) => ({
          href: `/services/${s.slug}`,
          label: s.name,
          line: s.shortDescription,
          meta: `${LEAD_LABEL[s.lead]} · ${s.durationMinutes} min`,
        }))}
      />
      {allLink ? (
        <p className="text-sm">
          <Link href={allLink.href} className="text-accent-strong">
            {allLink.label} →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
