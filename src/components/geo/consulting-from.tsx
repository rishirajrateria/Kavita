import { FigureSection } from "@/components/content";
import { Clocks } from "@/components/motifs";
import type { LocationRecord } from "@/content/locations/schema";
import type { BusinessHours } from "@/db/schema";
import { practitionerDay } from "@/lib/data/consultation-window";
import type { Question } from "./answers";
import { Paragraphs, type Plate } from "./parts";
import type { WindowInfo } from "./types";

const minutesOf = (hhmm: string | null): number | null => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? (h ?? 0) * 60 + (m ?? 0) : null;
};

/**
 * "Consulting from here" as a column plate: two 24-hour rings — the practitioner's working day
 * and the same hours in this place's clock, lit — with both windows and both zones in HTML
 * beneath them; on the right the question, its answer and the researched 150–250 words on the
 * time difference in practice. When the practitioner's hours are not yet confirmed the lit
 * arcs are dashed and the figure's line says so (SPEC §2.3, `Clocks`).
 */
export function GeoConsultingFrom({
  loc,
  question,
  route,
  window,
  practitionerTimezone,
  businessHours,
  plate,
}: {
  loc: LocationRecord;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  window: WindowInfo;
  practitionerTimezone: string;
  businessHours?: BusinessHours | null;
  plate: Plate;
}) {
  const text = loc.research?.consultingFrom;
  if (!text) return null;
  const day = practitionerDay(businessHours);
  const start = minutesOf(window.localStart);
  const end = minutesOf(window.localEnd);
  const local =
    start !== null && end !== null
      ? { openMinutes: start, closeMinutes: end, label: loc.timezone }
      : undefined;

  const cell = "border-t border-accent-border/40 py-4";
  const dt =
    "font-sans text-[0.65rem] font-semibold tracking-[0.12em] text-accent-strong uppercase";

  return (
    <FigureSection
      id="consulting-from"
      route={route}
      n={plate.n}
      tone={plate.tone}
      layout="column"
      question={question.question}
      answer={question.answer}
      line={day.assumed ? "Hours to be confirmed by the practitioner" : question.eyebrow}
      figureWidth="default"
      figure={
        <div className="w-full">
          <Clocks
            className="text-accent-strong"
            practitioner={{
              openMinutes: day.open,
              closeMinutes: day.close,
              label: practitionerTimezone,
            }}
            local={local}
            assumed={day.assumed}
          />
          <dl className="mt-4 grid grid-cols-2 gap-x-6 text-center">
            <div className={cell}>
              <dt className={dt}>Practitioner&rsquo;s hours</dt>
              <dd className="mt-2 font-serif text-[1.35rem] leading-snug">
                {window.practitionerWindow}
              </dd>
              <dd className="mt-1 font-sans text-[0.8rem] text-muted-foreground">
                {practitionerTimezone}
              </dd>
            </div>
            <div className={cell}>
              <dt className={dt}>In {loc.name}</dt>
              <dd className="mt-2 font-serif text-[1.35rem] leading-snug">{window.localWindow}</dd>
              <dd className="mt-1 font-sans text-[0.8rem] text-muted-foreground">
                {loc.timezone} · {window.offsetLabel}
              </dd>
            </div>
          </dl>
        </div>
      }
    >
      <Paragraphs text={text} />
    </FigureSection>
  );
}
