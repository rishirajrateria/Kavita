import { FigureSection } from "@/components/content";
import { NorthIndianChart, Ornament, VastuCompass } from "@/components/motifs";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import type { Question } from "./answers";
import { CAPTION_H3, Paragraphs, type Plate, SmallFigure } from "./parts";

/**
 * The researched opening (120–200 words, written for the place) as a column plate: the other
 * instrument small on the left — the compass rose on an astrology page, the chart on a vastu
 * page, so the method's two halves are both on the page — and on the right the question, its
 * answer, the opening prose, the real landmarks and, only when supplied, the concerns clients
 * from this place most often bring (CLAUDE.md §7, §12). Everything visible.
 */
export function GeoOpening({
  loc,
  service,
  question,
  route,
  plate,
}: {
  loc: LocationRecord;
  service: GeoService;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  plate: Plate;
}) {
  const r = loc.research;
  if (!r) return null;
  const opening = service === "astrologer" ? r.opening.astrologer : r.opening.vastu;
  const concerns = r.clientConcerns;

  return (
    <FigureSection
      id="opening"
      route={route}
      n={plate.n}
      tone={plate.tone}
      layout="column"
      question={question.question}
      answer={question.answer}
      line={question.eyebrow}
      figureWidth="narrow"
      figure={
        <SmallFigure>
          {service === "astrologer" ? (
            <VastuCompass strokeWidth={0.75} className="text-accent-strong" />
          ) : (
            <NorthIndianChart strokeWidth={0.6} className="text-accent-strong" />
          )}
        </SmallFigure>
      }
    >
      <Paragraphs text={opening} />

      <div className="pt-4">
        <h3 className={CAPTION_H3}>Around {loc.name}</h3>
        <ul className="mt-2 grid gap-x-10 sm:grid-cols-2">
          {r.landmarks.map((l) => (
            <li key={l.name} className="flex gap-3 border-t border-accent-border/25 py-4">
              <Ornament className="mt-1.5 size-3 shrink-0 text-accent-strong" />
              <span>
                <span className="font-serif text-[1.1rem] leading-snug text-foreground">
                  {l.name}
                </span>
                <span className="ml-2 font-sans text-[0.68rem] tracking-[0.1em] text-muted-foreground uppercase">
                  {l.kind}
                </span>
                {l.note ? (
                  <span className="mt-1 block font-sans text-sm leading-relaxed text-muted-foreground">
                    {l.note}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {concerns.length >= 2 ? (
        <div className="pt-2">
          <h3 className={CAPTION_H3}>What clients from {loc.name} most often bring</h3>
          <ul className="mt-2">
            {concerns.map((c) => (
              <li
                key={c}
                className="border-t border-accent-border/25 py-3 font-serif text-[1.15rem] leading-snug text-foreground"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </FigureSection>
  );
}
