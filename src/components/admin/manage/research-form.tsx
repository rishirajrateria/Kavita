"use client";

/**
 * Editor for a location's §7 research JSONB. Every field shows a live word/item count against
 * `RESEARCH_LIMITS`; the derived status (stub / partial / complete) updates as you type, exactly
 * as `deriveResearchStatus()` will decide it on save. Posts `{ research, contentUpdatedAt,
 * isFeatured }` to `PATCH /api/admin/locations/<path>`.
 */
import { useMemo, useState } from "react";
import {
  CHART_STYLES,
  LANDMARK_KINDS,
  MONTH_RECKONINGS,
  RESEARCH_LIMITS,
  deriveResearchStatus,
  locationResearchSchema,
  type LocationResearch,
} from "@/content/locations/schema";
import { Input } from "@/components/ui/input";
import { ActionForm } from "./action-form";
import {
  AddButton,
  RemoveButton,
  Section,
  TextField,
  WordArea,
  selectClass,
} from "./research-form-fields";
import { ResearchStatusBadge } from "./status-badge";

const EMPTY: LocationResearch = {
  landmarks: [
    { name: "", kind: "temple" },
    { name: "", kind: "neighbourhood" },
  ],
  tradition: { chartStyle: "north-indian", calendar: "", birthRecordsNote: "", narrative: "" },
  climateArchitecture: { facts: ["", ""], housingStock: "", narrative: "" },
  opening: { astrologer: "", vastu: "" },
  consultingFrom: "",
  faqs: [
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ],
  clientConcerns: [],
};

export function ResearchForm({
  path,
  initial,
  contentUpdatedAt,
  isFeatured,
  disabled,
}: {
  path: string;
  initial: LocationResearch | null;
  contentUpdatedAt: string;
  isFeatured: boolean;
  disabled?: boolean;
}) {
  const [r, setR] = useState<LocationResearch>(initial ?? EMPTY);
  const [date, setDate] = useState(contentUpdatedAt);
  const [featured, setFeatured] = useState(isFeatured);
  const status = useMemo(() => deriveResearchStatus(r), [r]);
  const issues = useMemo(() => {
    const parsed = locationResearchSchema.safeParse(r);
    return parsed.success
      ? []
      : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  }, [r]);
  const set = <K extends keyof LocationResearch>(key: K, value: LocationResearch[K]) =>
    setR({ ...r, [key]: value });

  return (
    <ActionForm
      action={`/api/admin/locations/${path}`}
      method="PATCH"
      payload={{ research: r, contentUpdatedAt: date, isFeatured: featured }}
      submitLabel="Save research"
      disabled={disabled}
      successMessage={`Saved. Status is now ${status}.`}
      className="gap-6"
    >
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/95 px-3 py-2 text-sm backdrop-blur">
        <span className="text-muted-foreground">Derived status:</span>
        <ResearchStatusBadge status={status} />
        {issues.length ? (
          <span className="text-xs text-warning">
            {issues.length} field{issues.length === 1 ? "" : "s"} outside limits — it would save as
            a stub.
          </span>
        ) : (
          <span className="text-xs text-success">All fields within limits.</span>
        )}
      </div>

      <Section
        title="Landmarks"
        hint={`${RESEARCH_LIMITS.landmarks.min}–${RESEARCH_LIMITS.landmarks.max} real, verifiable places`}
        count={`${r.landmarks.length} items`}
        ok={
          r.landmarks.length >= RESEARCH_LIMITS.landmarks.min &&
          r.landmarks.length <= RESEARCH_LIMITS.landmarks.max
        }
      >
        {r.landmarks.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_10rem_1fr_auto]">
            <Input
              placeholder="Name"
              value={l.name}
              onChange={(e) =>
                set(
                  "landmarks",
                  r.landmarks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                )
              }
            />
            <select
              value={l.kind}
              onChange={(e) =>
                set(
                  "landmarks",
                  r.landmarks.map((x, j) =>
                    j === i ? { ...x, kind: e.target.value as typeof l.kind } : x,
                  ),
                )
              }
              className={selectClass}
            >
              {LANDMARK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <Input
              placeholder="Note (optional)"
              value={l.note ?? ""}
              onChange={(e) =>
                set(
                  "landmarks",
                  r.landmarks.map((x, j) =>
                    j === i ? { ...x, note: e.target.value || undefined } : x,
                  ),
                )
              }
            />
            <RemoveButton
              onClick={() =>
                set(
                  "landmarks",
                  r.landmarks.filter((_, j) => j !== i),
                )
              }
              disabled={r.landmarks.length <= 1}
            />
          </div>
        ))}
        <AddButton
          label="Add landmark"
          onClick={() => set("landmarks", [...r.landmarks, { name: "", kind: "landmark" }])}
          disabled={r.landmarks.length >= RESEARCH_LIMITS.landmarks.max}
        />
      </Section>

      <Section
        title="Regional tradition"
        hint="Chart style, calendar and month reckoning used locally"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Chart style
            <select
              value={r.tradition.chartStyle}
              onChange={(e) =>
                set("tradition", {
                  ...r.tradition,
                  chartStyle: e.target.value as LocationResearch["tradition"]["chartStyle"],
                })
              }
              className={selectClass}
            >
              {CHART_STYLES.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Month reckoning
            <select
              value={r.tradition.monthReckoning ?? ""}
              onChange={(e) =>
                set("tradition", {
                  ...r.tradition,
                  monthReckoning: (e.target.value ||
                    undefined) as LocationResearch["tradition"]["monthReckoning"],
                })
              }
              className={selectClass}
            >
              <option value="">—</option>
              {MONTH_RECKONINGS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextField
          label="Calendar"
          value={r.tradition.calendar}
          onChange={(v) => set("tradition", { ...r.tradition, calendar: v })}
        />
        <TextField
          label="Birth-records note"
          value={r.tradition.birthRecordsNote}
          onChange={(v) => set("tradition", { ...r.tradition, birthRecordsNote: v })}
        />
        <WordArea
          label="Tradition narrative"
          value={r.tradition.narrative}
          min={RESEARCH_LIMITS.narrative.minWords}
          max={RESEARCH_LIMITS.narrative.maxWords}
          onChange={(v) => set("tradition", { ...r.tradition, narrative: v })}
        />
      </Section>

      <Section
        title="Climate and architecture"
        hint={`${RESEARCH_LIMITS.facts.min}–${RESEARCH_LIMITS.facts.max} facts that genuinely change vastu advice here`}
      >
        {r.climateArchitecture.facts.map((f, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={f}
              placeholder={`Fact ${i + 1}`}
              onChange={(e) =>
                set("climateArchitecture", {
                  ...r.climateArchitecture,
                  facts: r.climateArchitecture.facts.map((x, j) => (j === i ? e.target.value : x)),
                })
              }
            />
            <RemoveButton
              onClick={() =>
                set("climateArchitecture", {
                  ...r.climateArchitecture,
                  facts: r.climateArchitecture.facts.filter((_, j) => j !== i),
                })
              }
              disabled={r.climateArchitecture.facts.length <= 1}
            />
          </div>
        ))}
        <AddButton
          label="Add fact"
          onClick={() =>
            set("climateArchitecture", {
              ...r.climateArchitecture,
              facts: [...r.climateArchitecture.facts, ""],
            })
          }
          disabled={r.climateArchitecture.facts.length >= RESEARCH_LIMITS.facts.max}
        />
        <TextField
          label="Housing stock"
          value={r.climateArchitecture.housingStock}
          onChange={(v) =>
            set("climateArchitecture", { ...r.climateArchitecture, housingStock: v })
          }
        />
        <TextField
          label="Plot orientation (optional)"
          value={r.climateArchitecture.plotOrientation ?? ""}
          onChange={(v) =>
            set("climateArchitecture", {
              ...r.climateArchitecture,
              plotOrientation: v || undefined,
            })
          }
        />
        <WordArea
          label="Climate narrative"
          value={r.climateArchitecture.narrative}
          min={RESEARCH_LIMITS.narrative.minWords}
          max={RESEARCH_LIMITS.narrative.maxWords}
          onChange={(v) => set("climateArchitecture", { ...r.climateArchitecture, narrative: v })}
        />
      </Section>

      <Section title="Page openings" hint="The first paragraphs of the astrologer and vastu pages">
        <WordArea
          label="Astrologer page opening"
          value={r.opening.astrologer}
          min={RESEARCH_LIMITS.opening.minWords}
          max={RESEARCH_LIMITS.opening.maxWords}
          onChange={(v) => set("opening", { ...r.opening, astrologer: v })}
        />
        <WordArea
          label="Vastu page opening"
          value={r.opening.vastu}
          min={RESEARCH_LIMITS.opening.minWords}
          max={RESEARCH_LIMITS.opening.maxWords}
          onChange={(v) => set("opening", { ...r.opening, vastu: v })}
        />
        <WordArea
          label="Consulting from here"
          value={r.consultingFrom}
          min={RESEARCH_LIMITS.consultingFrom.minWords}
          max={RESEARCH_LIMITS.consultingFrom.maxWords}
          onChange={(v) => set("consultingFrom", v)}
        />
      </Section>

      <Section
        title="FAQs"
        hint={`${RESEARCH_LIMITS.faqs.min}–${RESEARCH_LIMITS.faqs.max} city-specific questions; each answer ${RESEARCH_LIMITS.faqs.answerMinWords}–${RESEARCH_LIMITS.faqs.answerMaxWords} words and names "Astrologer Kavita"`}
        count={`${r.faqs.length} items`}
        ok={r.faqs.length >= RESEARCH_LIMITS.faqs.min && r.faqs.length <= RESEARCH_LIMITS.faqs.max}
      >
        {r.faqs.map((f, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Question ending with ?"
                value={f.question}
                onChange={(e) =>
                  set(
                    "faqs",
                    r.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)),
                  )
                }
              />
              <RemoveButton
                onClick={() =>
                  set(
                    "faqs",
                    r.faqs.filter((_, j) => j !== i),
                  )
                }
                disabled={r.faqs.length <= 1}
              />
            </div>
            <WordArea
              label={`Answer ${i + 1}`}
              value={f.answer}
              min={RESEARCH_LIMITS.faqs.answerMinWords}
              max={RESEARCH_LIMITS.faqs.answerMaxWords}
              rows={3}
              onChange={(v) =>
                set(
                  "faqs",
                  r.faqs.map((x, j) => (j === i ? { ...x, answer: v } : x)),
                )
              }
              extra={f.answer.includes("Astrologer Kavita") ? null : "must name Astrologer Kavita"}
            />
          </div>
        ))}
        <AddButton
          label="Add FAQ"
          onClick={() => set("faqs", [...r.faqs, { question: "", answer: "" }])}
          disabled={r.faqs.length >= RESEARCH_LIMITS.faqs.max}
        />
      </Section>

      <Section
        title="Client concerns"
        hint={`Practitioner-supplied only (CLAUDE.md §7). Empty = partial (noindex); ${RESEARCH_LIMITS.clientConcerns.min}–${RESEARCH_LIMITS.clientConcerns.max} = complete.`}
        count={`${r.clientConcerns.length} items`}
        ok={
          r.clientConcerns.length === 0 ||
          (r.clientConcerns.length >= RESEARCH_LIMITS.clientConcerns.min &&
            r.clientConcerns.length <= RESEARCH_LIMITS.clientConcerns.max)
        }
      >
        {r.clientConcerns.map((c, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={c}
              onChange={(e) =>
                set(
                  "clientConcerns",
                  r.clientConcerns.map((x, j) => (j === i ? e.target.value : x)),
                )
              }
            />
            <RemoveButton
              onClick={() =>
                set(
                  "clientConcerns",
                  r.clientConcerns.filter((_, j) => j !== i),
                )
              }
            />
          </div>
        ))}
        <AddButton
          label="Add concern"
          onClick={() => set("clientConcerns", [...r.clientConcerns, ""])}
          disabled={r.clientConcerns.length >= RESEARCH_LIMITS.clientConcerns.max}
        />
      </Section>

      <Section
        title="Publishing"
        hint="The content date feeds sitemap lastmod; never set it to today without a real change."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Content updated (YYYY-MM-DD)
            <Input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              pattern="\d{4}-\d{2}-\d{2}"
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="size-4 accent-[var(--accent-strong)]"
            />
            Featured in &ldquo;cities we serve&rdquo; lists
          </label>
        </div>
        <TextField
          label="Testimonial id (optional, real consented id only)"
          value={r.testimonialId ?? ""}
          onChange={(v) => set("testimonialId", v || undefined)}
        />
      </Section>

      {issues.length ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">
            Why this would save as a stub ({issues.length})
          </summary>
          <ul className="mt-2 list-disc pl-5">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </ActionForm>
  );
}
