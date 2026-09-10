import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HOME_PLACEHOLDERS, KEY_FACTS } from "@/content/home";
import type { Location, Service, SiteSettings } from "@/lib/data";

/**
 * Compact definition list of the facts an answer engine lifts verbatim (CLAUDE.md §9.3), set
 * as a parchment band ruled with gold hairlines. Every value comes from settings, services or
 * the location tree — nothing is typed in here.
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
    <Section
      spacing="none"
      tone="muted"
      className="border-y border-accent-border/40"
      aria-labelledby="key-facts-heading"
    >
      <Container size="wide" className="py-8 sm:py-10">
        <Heading
          as="h2"
          level={6}
          id="key-facts-heading"
          className="mb-6 text-center font-sans text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase"
        >
          {KEY_FACTS.heading}
        </Heading>
        {/* 1px gaps over a gold-tinted ground draw the hairline grid between items. */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-accent-border/30 bg-accent-border/30 lg:grid-cols-4">
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
      </Container>
    </Section>
  );
}
