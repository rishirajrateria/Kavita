import { KeyFacts } from "@/components/content";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService, Service, SiteSettings } from "@/lib/data/types";
import { GEO_SERVICE_META } from "@/lib/geo/service";
import { realValue } from "@/lib/site";
import type { WindowInfo } from "./types";

/**
 * Key-facts slab (CLAUDE.md §9.3) for a geo page: service, practitioner, area served, modes,
 * languages, session length, time zone with today's offset, live-session window in both zones,
 * response time. Every value is data; the visual matches the home-page band exactly.
 *
 * Rendered on the shared `KeyFacts` plate — the page's one `.glass sheen` object (SPEC §2.5),
 * which also merges any facts saved for this route in `/admin/aeo`.
 */
export function GeoKeyFacts({
  loc,
  service,
  settings,
  services,
  window,
  countryName,
  route,
}: {
  loc: LocationRecord;
  service: GeoService;
  settings: SiteSettings;
  services: Service[];
  window: WindowInfo;
  countryName: string;
  /** Canonical route of the page, for `/admin/aeo` key-facts overrides. */
  route?: string;
}) {
  const durations = services.map((s) => s.durationMinutes);
  const min = durations.length ? Math.min(...durations) : 0;
  const max = durations.length ? Math.max(...durations) : 0;
  const practitioner = realValue(settings.practitionerName);
  const modes =
    service === "vastu-consultant"
      ? "Online by video or phone; vastu from a floor plan and photographs"
      : "Online by video or phone, worldwide";
  const area =
    loc.type === "country"
      ? `All of ${loc.name}`
      : loc.type === "state"
        ? `${loc.name}, ${countryName}`
        : `${loc.name} and surrounding areas, ${countryName}`;

  const ownFacts: { label: string; value: string }[] = [
    {
      label: "Service",
      value: `${GEO_SERVICE_META[service].label} — astrology and vastu read together`,
    },
    {
      label: "Practitioner",
      value: practitioner ? `${practitioner} (Astrologer Kavita)` : "Astrologer Kavita",
    },
    { label: "Area served", value: area },
    { label: "Consultation modes", value: modes },
    { label: "Languages", value: loc.languages.join(", ") },
    { label: "Session length", value: `${min}–${max} minutes, with a written summary` },
    {
      label: "Time zone",
      value: `${loc.timezone}; ${window.offsetLabel} relative to the practitioner today`,
    },
    {
      label: "Live-session window",
      value: `${window.localWindow} · ${window.practitionerWindow}`,
    },
    {
      label: "Response to enquiries",
      value: `Usually within ${settings.responseTimeHours} hours`,
    },
  ];
  return (
    <KeyFacts
      id="geo-key-facts"
      route={route}
      heading={`${GEO_SERVICE_META[service].label} in ${loc.name} at a glance`}
      items={ownFacts}
      columns={3}
      note={window.note}
    />
  );
}
