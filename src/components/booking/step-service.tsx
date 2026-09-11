import { Badge } from "@/components/ui/badge";
import { BOOK_SERVICE_STEP } from "@/content/pages/book";
import { durationLabel } from "@/lib/booking/format";
import { isPlaceholder } from "@/lib/site";
import { ChoiceCard } from "./choice-card";
import type { BookableService, BookingLocation } from "./types";

export interface StepServiceProps {
  services: BookableService[];
  selected: string | null;
  location: BookingLocation | null;
  onSelect: (slug: string) => void;
}

function priceLine(service: BookableService): string {
  if (service.priceMinor !== null && service.currency) {
    const amount = service.priceMinor / 100;
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: service.currency }).format(
        amount,
      );
    } catch {
      return `${service.currency} ${amount}`;
    }
  }
  if (service.priceNote && !isPlaceholder(service.priceNote)) return service.priceNote;
  return BOOK_SERVICE_STEP.priceOnRequest;
}

/** Step 1: one large card per service, lead badge and duration, price line only when real. */
export function StepService({ services, selected, location, onSelect }: StepServiceProps) {
  return (
    <div className="space-y-4">
      {location ? (
        <p className="text-sm text-muted-foreground">{BOOK_SERVICE_STEP.from(location.name)}</p>
      ) : null}
      <div role="radiogroup" aria-label="Consultation" className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <ChoiceCard
            key={service.slug}
            selected={service.slug === selected}
            onSelect={() => onSelect(service.slug)}
            meta={
              <>
                <Badge variant="caps">{BOOK_SERVICE_STEP.leadLabel[service.lead]}</Badge>
                <span>{durationLabel(service.durationMinutes)}</span>
              </>
            }
            title={service.name}
            description={service.shortDescription}
            footer={priceLine(service)}
          />
        ))}
      </div>
    </div>
  );
}
