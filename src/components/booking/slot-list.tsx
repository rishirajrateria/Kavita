import { BOOK_TIME_STEP } from "@/content/pages/book";
import { dayLabel, dualZoneParts } from "@/lib/booking/format";
import { cn } from "@/lib/utils";
import type { Slot } from "./types";

export interface SlotListProps {
  day: string | null;
  slots: Slot[];
  selected: Slot | null;
  clientTz: string;
  practitionerTz: string;
  onSelect: (slot: Slot) => void;
  /** Column heading override, e.g. "Nearest free times". */
  heading?: string;
}

/**
 * The free times of one day as a radio group. Every row carries the dual-zone label:
 * `3:00 PM your time · 11:30 PM IST`. Fixed minimum height so switching days never shifts
 * the layout.
 */
export function SlotList({
  day,
  slots,
  selected,
  clientTz,
  practitionerTz,
  onSelect,
  heading,
}: SlotListProps) {
  const title = heading ?? (day ? BOOK_TIME_STEP.slotsFor(dayLabel(day)) : BOOK_TIME_STEP.pickADay);
  return (
    <div className="min-h-[18rem] w-full">
      <p className="mb-3 font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase">
        {title}
      </p>
      {day && slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{BOOK_TIME_STEP.noSlotsForDay}</p>
      ) : null}
      {slots.length > 0 ? (
        <div
          role="radiogroup"
          aria-label={title}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
        >
          {slots.map((slot) => {
            const parts = dualZoneParts(slot.startsAt, clientTz, practitionerTz);
            const isSelected = selected?.startsAt === slot.startsAt;
            return (
              <button
                key={slot.startsAt}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(slot)}
                className={cn(
                  "flex min-h-14 w-full items-center justify-between gap-4 rounded-lg border px-4 py-2 text-left transition-[border-color,background-color,box-shadow] duration-(--duration-fast) ease-standard outline-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isSelected
                    ? "border-cta bg-cta text-cta-foreground shadow-cta"
                    : "border-border bg-background/85 hover:border-accent-border hover:bg-accent/40",
                )}
              >
                <span className="flex flex-col">
                  <span className="font-serif text-lg leading-tight">
                    {parts.clientTime}{" "}
                    <span
                      className={cn(
                        "font-sans text-xs",
                        isSelected ? "opacity-80" : "text-muted-foreground",
                      )}
                    >
                      {parts.practitionerTime === null ? parts.clientZone : BOOK_TIME_STEP.yourTime}
                    </span>
                  </span>
                  {parts.practitionerTime !== null ? (
                    <span
                      className={cn("text-xs", isSelected ? "opacity-80" : "text-muted-foreground")}
                    >
                      {parts.practitionerTime} {parts.practitionerZone}
                      {parts.crossesDate ? " (her next day)" : ""}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-cta-foreground/60" : "border-border",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full bg-current",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
