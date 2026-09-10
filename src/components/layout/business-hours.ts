import type { BusinessHours, Weekday } from "@/lib/data/types";

const DAY_LABEL: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
const ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export interface HoursLine {
  days: string;
  hours: string;
}

/**
 * Collapse `business_hours` into display lines, merging consecutive days with identical
 * intervals: `Mon–Fri 10:00–18:00`, `Sat 10:00–14:00`, `Sun Closed`.
 */
export function formatBusinessHours(hours: BusinessHours): HoursLine[] {
  const lines: HoursLine[] = [];
  let runStart: Weekday | null = null;
  let runEnd: Weekday | null = null;
  let runKey = "";

  const flush = () => {
    if (!runStart || !runEnd) return;
    const days =
      runStart === runEnd ? DAY_LABEL[runStart] : `${DAY_LABEL[runStart]}–${DAY_LABEL[runEnd]}`;
    lines.push({ days, hours: runKey });
  };

  for (const day of ORDER) {
    const intervals = hours[day];
    const key = intervals?.length
      ? intervals.map((i) => `${i.open}–${i.close}`).join(", ")
      : "Closed";
    if (runStart && key === runKey) {
      runEnd = day;
      continue;
    }
    flush();
    runStart = day;
    runEnd = day;
    runKey = key;
  }
  flush();
  return lines;
}
