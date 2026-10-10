import { Badge } from "@/components/ui/badge";
import { LEAD_LABEL } from "@/content/pages/services";
import type { ServiceLead } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * A hairline pill in Cinzel caption type stating whether a service is astrology-led, vastu-led
 * or integrated — the door-label voice (SPEC §2.1), no fill behind the type.
 */
export function LeadBadge({ lead, className }: { lead: ServiceLead; className?: string }) {
  return (
    <Badge
      variant="caps"
      className={cn(
        "border-accent-border/50 bg-transparent px-3.5 py-1.5 font-display text-[0.62rem] font-semibold tracking-[0.22em] text-accent-strong",
        className,
      )}
    >
      {LEAD_LABEL[lead]}
    </Badge>
  );
}
