/**
 * "Add to calendar" URLs, built from the booking instant alone so the confirmation screen
 * (client) and `/booking/[token]` (server) render identical links. The `.ics` link is served
 * by P4-A: `GET /api/bookings/[token]?format=ics`.
 */
export interface CalendarLinkInput {
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  location?: string;
  token: string;
}

export interface CalendarLinks {
  google: string;
  outlook: string;
  ics: string;
}

/** `20260318T150000Z` — the compact UTC form Google Calendar expects. */
export function compactUtc(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function icsHref(token: string): string {
  return `/api/bookings/${encodeURIComponent(token)}?format=ics`;
}

export function calendarLinks(input: CalendarLinkInput): CalendarLinks {
  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", input.title);
  google.searchParams.set("dates", `${compactUtc(input.startsAt)}/${compactUtc(input.endsAt)}`);
  if (input.description) google.searchParams.set("details", input.description);
  if (input.location) google.searchParams.set("location", input.location);

  const outlook = new URL("https://outlook.live.com/calendar/0/action/compose");
  outlook.searchParams.set("rru", "addevent");
  outlook.searchParams.set("subject", input.title);
  outlook.searchParams.set("startdt", new Date(input.startsAt).toISOString());
  outlook.searchParams.set("enddt", new Date(input.endsAt).toISOString());
  if (input.description) outlook.searchParams.set("body", input.description);
  if (input.location) outlook.searchParams.set("location", input.location);

  return { google: google.toString(), outlook: outlook.toString(), ics: icsHref(input.token) };
}
