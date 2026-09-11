"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { BOOK_TIME_STEP } from "@/content/pages/book";
import {
  dateKeyInZone,
  dualZoneLabel,
  durationLabel,
  monthKeyOf,
  offsetSentence,
  zoneAbbreviation,
} from "@/lib/booking/format";
import { MonthGrid } from "./month-grid";
import { SlotList } from "./slot-list";
import type { Availability } from "./use-availability";
import { ZoneSelect } from "./zone-select";
import type { BookableService, Slot } from "./types";

export interface StepTimeProps {
  service: BookableService;
  availability: Availability;
  clientTz: string;
  practitionerTz: string;
  extraZones: string[];
  month: string;
  day: string | null;
  slot: Slot | null;
  minMonth: string;
  maxMonth: string;
  now: string;
  onZone: (tz: string) => void;
  onMonth: (month: string) => void;
  onDay: (day: string) => void;
  onSlot: (slot: Slot) => void;
}

/**
 * Step 3: zone selector, month grid on the left, the chosen day's slots on the right — every
 * slot dual-labelled. The two columns keep fixed minimum heights so loading, switching days
 * or months never moves the Continue button.
 */
export function StepTime(props: StepTimeProps) {
  const { availability, clientTz, practitionerTz, service, now } = props;
  const available = new Set(availability.days.keys());
  const daySlots = props.day ? (availability.days.get(props.day) ?? []) : [];
  const todayKey = dateKeyInZone(now, clientTz);
  const buffer = service.bufferAfterMinutes > 0 ? durationLabel(service.bufferAfterMinutes) : "";
  const monthHasDays = Array.from(available).some((d) => monthKeyOf(d) === props.month);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-end">
        <ZoneSelect value={clientTz} onChange={props.onZone} extra={props.extraZones} at={now} />
        <p className="text-sm leading-relaxed text-muted-foreground sm:pb-6">
          {BOOK_TIME_STEP.practitionerLine(
            zoneAbbreviation(practitionerTz, now),
            offsetSentence(clientTz, practitionerTz, now),
          )}{" "}
          {BOOK_TIME_STEP.durationNote(durationLabel(service.durationMinutes), buffer)}
        </p>
      </div>

      {availability.status === "error" ? (
        <Callout variant="error" title={BOOK_TIME_STEP.loadFailed}>
          <Button
            type="button"
            variant="gold-outline"
            size="sm"
            onClick={availability.reload}
            className="mt-2"
          >
            {BOOK_TIME_STEP.retry}
          </Button>
        </Callout>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[26rem_1fr] lg:gap-12">
        <div className="min-h-[24rem]">
          <MonthGrid
            month={props.month}
            available={available}
            selected={props.day}
            todayKey={todayKey}
            minMonth={props.minMonth}
            maxMonth={props.maxMonth}
            loading={availability.status === "loading"}
            onSelect={props.onDay}
            onMonthChange={props.onMonth}
          />
          <p className="mt-2 min-h-5 text-xs text-muted-foreground" aria-live="polite">
            {availability.status === "loading"
              ? BOOK_TIME_STEP.loading
              : availability.status === "ready" && !monthHasDays
                ? BOOK_TIME_STEP.noDaysThisMonth
                : ""}
          </p>
        </div>
        <SlotList
          day={props.day}
          slots={daySlots}
          selected={props.slot}
          clientTz={clientTz}
          practitionerTz={practitionerTz}
          onSelect={props.onSlot}
        />
      </div>

      <p className="min-h-6 text-sm font-medium text-foreground" aria-live="polite">
        {props.slot
          ? BOOK_TIME_STEP.selected(dualZoneLabel(props.slot.startsAt, clientTz, practitionerTz))
          : ""}
      </p>
    </div>
  );
}
