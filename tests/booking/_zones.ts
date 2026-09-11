/** Independent (Intl-only) zone formatter so the tests never trust TZDate to check TZDate. */
export function localLabel(iso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "??";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/** The seven target-market zones (CLAUDE.md §2) — every one checked against Asia/Kolkata. */
export const MARKET_ZONES = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Toronto",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;
