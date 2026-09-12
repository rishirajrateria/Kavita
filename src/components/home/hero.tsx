import { KundliNav } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { HUB } from "@/content/home";
import type { SiteSettings } from "@/lib/data";

/**
 * The landing: the chart is the door.
 *
 * One short question in the visitor's own words, one sentence carrying the keywords, and then
 * the kundli — large, in the middle, drawing itself, with its twelve houses as the site's
 * navigation and "Book a reading" at the point where every line meets. Three small facts sit at
 * the edges. That is the whole first screen; nothing on it needs reading to be understood.
 *
 * Everything here is in the served HTML: the H1, the lede, twelve real links and their titles.
 * The section is a Server Component and the hub needs no JavaScript.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  const facts = [
    { label: "Online", value: "worldwide, in your own hours" },
    { label: "Reply", value: `within ${settings.responseTimeHours} hours` },
    { label: "After", value: "a written summary of the reading" },
  ] as const;

  return (
    <Section as="header" spacing="none" className="pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20">
      <Container size="wide" className="relative">
        <div className="mx-auto max-w-[44rem] text-center">
          <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
            {HUB.eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(2.1rem,1.3rem+3.4vw,3.9rem)] leading-[1.05] font-normal tracking-[-0.015em] text-balance">
            {HUB.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-[36rem] text-base leading-relaxed text-muted-foreground sm:text-lg">
            {HUB.lede}
          </p>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-[min(94vw,66rem)] sm:mt-12 lg:mt-14">
          {/* A soft bloom behind the hub so it reads as lit from within, not pasted on. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[150%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, var(--glow), transparent 70%)" }}
          />
          <KundliNav houses={HUB.houses} centre={HUB.centre} />
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-muted-foreground">{HUB.hint}</p>

        <dl className="mx-auto mt-10 flex max-w-[46rem] flex-wrap justify-center gap-x-10 gap-y-4 text-sm">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline gap-2">
              <dt className="text-[0.68rem] font-semibold tracking-[0.18em] text-accent-strong uppercase">
                {f.label}
              </dt>
              <dd className="text-muted-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
