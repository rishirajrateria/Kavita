import { QuestionHeading } from "@/components/home/question-heading";
import { Ornament } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import type { Question } from "./answers";

/** Split a research paragraph on blank lines so long openings breathe. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * The researched opening (120–200 words, written for the place) under its question, with an
 * aside of real, verifiable landmarks and — only when the practitioner has supplied them — the
 * concerns clients from this place most often bring (CLAUDE.md §7, §12).
 */
export function GeoOpening({
  loc,
  service,
  question,
  route,
  tone = "default",
}: {
  loc: LocationRecord;
  service: GeoService;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  tone?: "default" | "muted";
}) {
  const r = loc.research;
  if (!r) return null;
  const opening = service === "astrologer" ? r.opening.astrologer : r.opening.vastu;
  const concerns = r.clientConcerns;

  return (
    <Section id="opening" spacing="lg" tone={tone}>
      <Container size="wide" className="space-y-12">
        <QuestionHeading block={question} route={route} id="opening" layout="split" />

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="max-w-prose space-y-6 text-lg leading-relaxed text-muted-foreground">
            {paragraphs(opening).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          <aside className="space-y-10 border-t border-accent-border/50 pt-7 lg:border-t-0 lg:border-l lg:border-accent-border/30 lg:pt-0 lg:pl-10">
            <div>
              <Heading
                as="h3"
                level={6}
                className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
              >
                Around {loc.name}
              </Heading>
              <ul className="mt-5 space-y-4">
                {r.landmarks.map((l) => (
                  <li key={l.name} className="flex gap-3">
                    <Ornament className="mt-1.5 size-3.5 shrink-0 text-accent-strong" />
                    <span>
                      <span className="font-serif text-lg text-foreground">{l.name}</span>
                      <span className="ml-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                        {l.kind}
                      </span>
                      {l.note ? (
                        <span className="block text-sm leading-relaxed text-muted-foreground">
                          {l.note}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {concerns.length >= 2 ? (
              <div>
                <Heading
                  as="h3"
                  level={6}
                  className="font-sans text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase"
                >
                  What clients from {loc.name} most often bring
                </Heading>
                <ul className="mt-5 space-y-3 border-l-2 border-accent-border pl-5 font-serif text-xl leading-snug">
                  {concerns.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </Section>
  );
}
