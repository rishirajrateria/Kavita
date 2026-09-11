import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService, Service, SiteSettings } from "@/lib/data/types";
import { GEO_SERVICE_META } from "@/lib/geo/service";
import { realValue } from "@/lib/site";
import type { WindowInfo } from "./types";

/**
 * Ruled key-facts band (CLAUDE.md §9.3) for a geo page: service, practitioner, area served,
 * modes, languages, session length, time zone with today's offset, live-session window in both
 * zones, response time. Every value is data; the visual matches the home-page band exactly.
 */
export function GeoKeyFacts({
  loc,
  service,
  settings,
  services,
  window,
  countryName,
}: {
  loc: LocationRecord;
  service: GeoService;
  settings: SiteSettings;
  services: Service[];
  window: WindowInfo;
  countryName: string;
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

  const facts: readonly [string, string][] = [
    ["Service", `${GEO_SERVICE_META[service].label} — astrology and vastu read together`],
    ["Practitioner", practitioner ? `${practitioner} (Astrologer Kavita)` : "Astrologer Kavita"],
    ["Area served", area],
    ["Consultation modes", modes],
    ["Languages", loc.languages.join(", ")],
    ["Session length", `${min}–${max} minutes, with a written summary`],
    ["Time zone", `${loc.timezone}; ${window.offsetLabel} relative to the practitioner today`],
    ["Live-session window", `${window.localWindow} · ${window.practitionerWindow}`],
    ["Response to enquiries", `Usually within ${settings.responseTimeHours} hours`],
  ];

  return (
    <Section
      spacing="none"
      tone="muted"
      className="border-y border-accent-border/40"
      aria-labelledby="geo-key-facts"
    >
      <Container size="wide" className="py-8 sm:py-10">
        <Heading
          as="h2"
          level={6}
          id="geo-key-facts"
          className="mb-6 text-center font-sans text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase"
        >
          {GEO_SERVICE_META[service].label} in {loc.name} at a glance
        </Heading>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-accent-border/30 bg-accent-border/30 lg:grid-cols-3 [&>div:last-child]:col-span-2 lg:[&>div:last-child]:col-span-1">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-surface-muted px-4 py-4 sm:px-5 sm:py-5">
              <dt className="text-[0.65rem] font-semibold tracking-[0.1em] text-accent-strong uppercase sm:text-[0.68rem] sm:tracking-[0.12em]">
                {label}
              </dt>
              <dd className="mt-1.5 font-serif text-[0.95rem] leading-snug text-foreground sm:text-lg">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {window.note ? <p className="mt-4 text-sm text-muted-foreground">{window.note}</p> : null}
      </Container>
    </Section>
  );
}
