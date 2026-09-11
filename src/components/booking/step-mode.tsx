import { PhoneIcon, MapPinIcon, VideoIcon } from "lucide-react";
import { Callout } from "@/components/ui/callout";
import { BOOK_MODE_STEP } from "@/content/pages/book";
import { ChoiceCard } from "./choice-card";
import type { BookableService, BookingMode } from "./types";

export interface StepModeProps {
  service: BookableService;
  selected: BookingMode | null;
  inPersonOffered: boolean;
  practitionerCity: string;
  onSelect: (mode: BookingMode) => void;
}

const ICONS = { online_video: VideoIcon, online_phone: PhoneIcon, in_person: MapPinIcon } as const;

/** Step 2: video, phone and — only where offered — in person. */
export function StepMode({
  service,
  selected,
  inPersonOffered,
  practitionerCity,
  onSelect,
}: StepModeProps) {
  const serviceModes = new Set(service.deliveryModes);
  const modes: BookingMode[] = (["online_video", "online_phone", "in_person"] as const).filter(
    (m) => serviceModes.has(m) && (m !== "in_person" || inPersonOffered),
  );
  const inPersonHidden = serviceModes.has("in_person") && !inPersonOffered;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Format" className="grid gap-3 sm:grid-cols-3">
        {modes.map((mode) => {
          const Icon = ICONS[mode];
          const description =
            mode === "in_person"
              ? BOOK_MODE_STEP.modes.in_person.description(practitionerCity)
              : BOOK_MODE_STEP.modes[mode].description;
          return (
            <ChoiceCard
              key={mode}
              selected={selected === mode}
              onSelect={() => onSelect(mode)}
              meta={<Icon aria-hidden="true" className="size-5 text-accent-strong" />}
              title={BOOK_MODE_STEP.modes[mode].label}
              description={description}
            />
          );
        })}
      </div>
      {inPersonHidden ? (
        <Callout variant="info" hideIcon className="max-w-[40rem]">
          {BOOK_MODE_STEP.inPersonUnavailable(practitionerCity)}
        </Callout>
      ) : null}
    </div>
  );
}
