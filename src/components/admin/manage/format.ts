/** Small, Intl-only formatters for management tables (server and client safe). */

export function fmtDateTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function fmtDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function fmtTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function tzShort(date: Date, tz: string): string {
  return (
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? tz
  );
}

export const MODE_LABEL: Record<"online_video" | "online_phone" | "in_person", string> = {
  online_video: "Video call",
  online_phone: "Phone call",
  in_person: "In person",
};

export function bookingRef(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(0)}`;
  }
}
