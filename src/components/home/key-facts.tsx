import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HOME_PLACEHOLDERS, KEY_FACTS } from "@/content/home";
import type { Location, Service, SiteSettings } from "@/lib/data";

/**
 * Compact definition list of the facts an answer engine lifts verbatim (CLAUDE.md §9.3).
 * Every value comes from settings, services or the location tree — nothing is typed in here.
 */
export function KeyFacts({
  settings,
  services,
  countries,
}: {
  settings: SiteSettings;
  services: Service[];
  countries: Location[];
}) {
  const durations = services.map((s) => s.durationMinutes);
  const minDuration = durations.length ? Math.min(...durations) : 0;
  const maxDuration = durations.length ? Math.max(...durations) : 0;

  const inPerson = settings.inPersonAvailable
    ? KEY_FACTS.modesInPerson(settings.city)
    : `${KEY_FACTS.modesInPerson(settings.city)} (${HOME_PLACEHOLDERS.inPerson})`;

  const facts: readonly [string, string][] = [
    [KEY_FACTS.labels.practitioner, `${settings.practitionerName} (Astrologer Kavita)`],
    [KEY_FACTS.labels.practice, KEY_FACTS.practice],
    [KEY_FACTS.labels.modes, `${KEY_FACTS.modesOnline}; ${inPerson}`],
    [KEY_FACTS.labels.languages, HOME_PLACEHOLDERS.languages],
    [KEY_FACTS.labels.sessionLength, KEY_FACTS.sessionLength(minDuration, maxDuration)],
    [KEY_FACTS.labels.timezone, `${settings.timezone}; ${KEY_FACTS.timezoneNote}`],
    [KEY_FACTS.labels.responseTime, KEY_FACTS.responseTime(settings.responseTimeHours)],
    [KEY_FACTS.labels.areaServed, countries.map((c) => c.name).join(", ")],
  ];

  return (
    <Section spacing="sm" tone="muted" bordered aria-labelledby="key-facts-heading">
      <Container size="wide">
        <Heading as="h2" level={5} id="key-facts-heading" className="mb-5">
          {KEY_FACTS.heading}
        </Heading>
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="border-t border-accent-border/40 pt-3">
              <dt className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
                {label}
              </dt>
              <dd className="mt-1 leading-relaxed text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
