"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOK_TIME_STEP } from "@/content/pages/book";
import { addMonths, dayLabel, monthCells, monthLabel } from "@/lib/booking/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export interface MonthGridProps {
  month: string;
  /** `YYYY-MM-DD` keys with at least one free slot. */
  available: ReadonlySet<string>;
  selected: string | null;
  todayKey: string;
  minMonth: string;
  maxMonth: string;
  loading: boolean;
  onSelect: (day: string) => void;
  onMonthChange: (month: string) => void;
}

/**
 * Hand-rolled month grid (no calendar library): always six rows, Monday first, roving tabindex
 * with arrow-key movement between free days, Home/End to the first/last free day, PageUp/Down
 * for months. Unavailable days are plain text, not disabled buttons, so the tab order is short.
 */
export function MonthGrid({
  month,
  available,
  selected,
  todayKey,
  minMonth,
  maxMonth,
  loading,
  onSelect,
  onMonthChange,
}: MonthGridProps) {
  const cells = monthCells(month);
  const freeDays = cells.filter((c): c is string => c !== null && available.has(c));
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);

  const activeKey =
    (selected && available.has(selected) ? selected : null) ??
    (focusKey && available.has(focusKey) ? focusKey : null) ??
    freeDays[0] ??
    null;

  useEffect(() => {
    if (!pendingFocus.current) return;
    const el = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${pendingFocus.current}"]`,
    );
    el?.focus();
    pendingFocus.current = null;
  });

  const canPrev = month > minMonth;
  const canNext = month < maxMonth;

  function move(from: string, delta: number) {
    const index = freeDays.indexOf(from);
    const next = freeDays[index + delta];
    if (next) {
      setFocusKey(next);
      pendingFocus.current = next;
    }
  }

  function moveByDays(from: string, days: number) {
    // Move to the nearest free day at or beyond `from ± days`, staying inside the month.
    const target = shiftKey(from, days);
    const candidates =
      days > 0
        ? freeDays.filter((d) => d >= target)
        : freeDays.filter((d) => d <= target).reverse();
    const next = candidates[0];
    if (next) {
      setFocusKey(next);
      pendingFocus.current = next;
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        move(day, 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        move(day, -1);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveByDays(day, 7);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveByDays(day, -7);
        break;
      case "Home":
        event.preventDefault();
        if (freeDays[0]) {
          setFocusKey(freeDays[0]);
          pendingFocus.current = freeDays[0];
        }
        break;
      case "End": {
        event.preventDefault();
        const last = freeDays[freeDays.length - 1];
        if (last) {
          setFocusKey(last);
          pendingFocus.current = last;
        }
        break;
      }
      case "PageDown":
        if (canNext) {
          event.preventDefault();
          onMonthChange(addMonths(month, 1));
        }
        break;
      case "PageUp":
        if (canPrev) {
          event.preventDefault();
          onMonthChange(addMonths(month, -1));
        }
        break;
    }
  }

  return (
    <div className="w-full max-w-[26rem]">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={() => onMonthChange(addMonths(month, -1))}
          disabled={!canPrev}
          aria-label={BOOK_TIME_STEP.previousMonth}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <p className="font-serif text-xl text-foreground" aria-live="polite">
          {monthLabel(month)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={() => onMonthChange(addMonths(month, 1))}
          disabled={!canNext}
          aria-label={BOOK_TIME_STEP.nextMonth}
        >
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={`${monthLabel(month)}: ${freeDays.length} days with free times`}
        aria-busy={loading || undefined}
        className={cn(
          "grid grid-cols-7 gap-1 transition-opacity duration-(--duration-base)",
          loading && "opacity-60",
        )}
      >
        <div role="row" className="contents">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              role="columnheader"
              className="pb-1 text-center text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
            >
              {w}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, row) => (
          <div key={row} role="row" className="contents">
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              if (!day) {
                return (
                  <div key={`blank-${row}-${col}`} role="gridcell" className="aspect-square" />
                );
              }
              const free = available.has(day);
              const isSelected = day === selected;
              const isToday = day === todayKey;
              const dayNumber = Number(day.slice(8));
              if (!free) {
                return (
                  <div
                    key={day}
                    role="gridcell"
                    aria-disabled="true"
                    aria-label={dayLabel(day)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-full text-sm text-muted-foreground/60 tabular-nums",
                      isToday && "ring-1 ring-accent-border/50 ring-inset",
                    )}
                  >
                    {dayNumber}
                  </div>
                );
              }
              return (
                <div key={day} role="gridcell" className="aspect-square">
                  <button
                    type="button"
                    data-day={day}
                    tabIndex={day === activeKey ? 0 : -1}
                    aria-pressed={isSelected}
                    aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}, free times available`}
                    onClick={() => onSelect(day)}
                    onFocus={() => setFocusKey(day)}
                    onKeyDown={(e) => onKeyDown(e, day)}
                    className={cn(
                      "flex size-full items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-[background-color,border-color,color,box-shadow] duration-(--duration-fast) ease-standard outline-none",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      isSelected
                        ? "border-cta bg-cta text-cta-foreground shadow-cta"
                        : "border-accent-border/50 bg-accent/40 text-foreground hover:border-accent-border hover:bg-accent",
                      isToday && !isSelected && "ring-1 ring-accent-border ring-inset",
                    )}
                  >
                    {dayNumber}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-full border border-accent-border/50 bg-accent/40"
          />
          {BOOK_TIME_STEP.legendAvailable}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-full ring-1 ring-accent-border ring-inset"
          />
          {BOOK_TIME_STEP.legendToday}
        </span>
      </p>
    </div>
  );
}

/** Shift a `YYYY-MM-DD` key by whole days (UTC arithmetic on a calendar date). */
function shiftKey(key: string, days: number): string {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
