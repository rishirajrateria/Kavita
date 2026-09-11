import { Badge } from "@/components/ui/badge";
import { LEAD_LABEL } from "@/content/pages/services";
import type { ServiceLead } from "@/lib/data";

/** Small-caps pill stating whether a service is astrology-led, vastu-led or integrated. */
export function LeadBadge({ lead, className }: { lead: ServiceLead; className?: string }) {
  return (
    <Badge variant="caps" className={className}>
      {LEAD_LABEL[lead]}
    </Badge>
  );
}
