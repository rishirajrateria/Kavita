import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { HOME_PLACEHOLDERS, KEY_FACTS } from "@/content/home";
import type { Location, Service, SiteSettings } from "@/lib/data";
import { getKeyFactsOverride, mergeKeyFacts } from "@/lib/seo/aeo-data";

/**
 * Compact definition list of the facts an answer engine lifts verbatim (CLAUDE.md §9.3), set
 * as a band ruled with gold hairlines. Every value comes from settings, services or
 * the location tree — nothing is typed in here.
 */
export async function KeyFacts({
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

  const ownFacts = [
    {
      label: KEY_FACTS.labels.practitioner,
      value: `${settings.practitionerName} (Astrologer Kavita)`,
    },
    { label: KEY_FACTS.labels.practice, value: KEY_FACTS.practice },
    { label: KEY_FACTS.labels.modes, value: `${KEY_FACTS.modesOnline}; ${inPerson}` },
    { label: KEY_FACTS.labels.languages, value: HOME_PLACEHOLDERS.languages },
    {
      label: KEY_FACTS.labels.sessionLength,
      value: KEY_FACTS.sessionLength(minDuration, maxDuration),
    },
    { label: KEY_FACTS.labels.timezone, value: `${settings.timezone}; ${KEY_FACTS.timezoneNote}` },
    {
      label: KEY_FACTS.labels.responseTime,
      value: KEY_FACTS.responseTime(settings.responseTimeHours),
    },
    { label: KEY_FACTS.labels.areaServed, value: countries.map((c) => c.name).join(", ") },
  ];
  const facts = mergeKeyFacts(ownFacts, await getKeyFactsOverride("/"));

  return (
    <Section
      spacing="none"
      tone="gold"
      className="border-y border-accent-border/40"
      aria-labelledby="key-facts-heading"
    >
      <Container size="wide" className="py-12 sm:py-16">
        <Heading
          as="h2"
          level={6}
          id="key-facts-heading"
          className="font-sans text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase"
        >
          {KEY_FACTS.heading}
        </Heading>
        {/* Each fact is ruled, not boxed: one gold hairline over it and air around it. */}
        <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ label, value }) => (
            <div key={label} className="border-t border-accent-border/40 pt-5">
              <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
                {label}
              </dt>
              <dd className="mt-2.5 font-serif text-lg leading-snug text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
