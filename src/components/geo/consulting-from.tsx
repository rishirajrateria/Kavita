import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { Question } from "./answers";
import { paragraphs } from "./opening";
import type { WindowInfo } from "./types";

/**
 * "Consulting from here": the researched 150–250 words on the time difference in practice,
 * what to prepare and how the session runs, with a two-cell ruled strip that puts the
 * practitioner's window and the local window side by side — hairlines only, no cell fills, so
 * the two clocks read as an instrument panel rather than two more boxes.
 */
export function GeoConsultingFrom({
  loc,
  question,
  route,
  window,
  practitionerTimezone,
  tone = "muted",
}: {
  loc: LocationRecord;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  window: WindowInfo;
  practitionerTimezone: string;
  tone?: "default" | "muted";
}) {
  const text = loc.research?.consultingFrom;
  if (!text) return null;

  return (
    <Section id="consulting-from" spacing="lg" tone={tone}>
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={question} route={route} id="consulting-from" layout="split" />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <dl className="grid gap-x-10 self-start sm:grid-cols-2 lg:grid-cols-1">
            <div className="border-t border-accent-border/40 py-5">
              <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
                Practitioner&rsquo;s hours
              </dt>
              <dd className="mt-2 font-serif text-3xl leading-snug">{window.practitionerWindow}</dd>
              <dd className="mt-1 text-sm text-muted-foreground">{practitionerTimezone}</dd>
            </div>
            <div className="border-t border-accent-border/40 py-5">
              <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
                In {loc.name}
              </dt>
              <dd className="mt-2 font-serif text-3xl leading-snug">{window.localWindow}</dd>
              <dd className="mt-1 text-sm text-muted-foreground">
                {loc.timezone} · {window.offsetLabel}
              </dd>
            </div>
          </dl>
          <div className="max-w-prose space-y-6 text-lg leading-relaxed text-muted-foreground">
            {paragraphs(text).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
