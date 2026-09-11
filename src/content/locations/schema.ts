/**
 * Location data model for the geo-page engine (CLAUDE.md §6, §7; Phase 2 contract).
 *
 * Every location is a `LocationBase` (verifiable geography only) plus optional
 * `LocationResearch` (the §7 researched fields, written by hand per place, never generated).
 * `deriveResearchStatus()` is the single rule that decides whether a page may exist:
 *
 *   stub     — no research                          → 404, never generated
 *   partial  — every research field present and within limits, but no
 *              practitioner-supplied `clientConcerns` → renders with `noindex`
 *   complete — partial + ≥2 `clientConcerns`         → indexable + sitemapped
 *
 * Word/count limits live in `RESEARCH_LIMITS`; the Zod schemas enforce them so a research file
 * that is out of range fails `pnpm test` rather than silently downgrading.
 */
import { z } from "zod";

// --- enumerations -----------------------------------------------------------------------------

export const LOCATION_TYPES = ["country", "state", "city"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const RESEARCH_STATUSES = ["complete", "partial", "stub"] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];

export const LOCATION_CURRENCIES = ["INR", "USD", "GBP", "AED", "CAD", "AUD", "SGD"] as const;
export type Currency = (typeof LOCATION_CURRENCIES)[number];

export const POPULATION_TIERS = ["mega", "large", "medium", "small"] as const;
export type PopulationTier = (typeof POPULATION_TIERS)[number];

export const HREFLANGS = ["en-IN", "en-US", "en-GB", "en-AE", "en-CA", "en-AU", "en-SG"] as const;
export type Hreflang = (typeof HREFLANGS)[number];

export const LANDMARK_KINDS = ["temple", "neighbourhood", "district", "landmark"] as const;
export type LandmarkKind = (typeof LANDMARK_KINDS)[number];

export const CHART_STYLES = ["north-indian", "south-indian", "east-indian", "mixed"] as const;
export type ChartStyle = (typeof CHART_STYLES)[number];

export const MONTH_RECKONINGS = ["amanta", "purnimanta", "solar", "mixed"] as const;
export type MonthReckoning = (typeof MONTH_RECKONINGS)[number];

// --- limits -----------------------------------------------------------------------------------

/** Word and item limits for every research field. Enforced by `locationResearchSchema`. */
export const RESEARCH_LIMITS = {
  landmarks: { min: 2, max: 4 },
  facts: { min: 2, max: 3 },
  narrative: { minWords: 150, maxWords: 250 },
  opening: { minWords: 120, maxWords: 200 },
  consultingFrom: { minWords: 150, maxWords: 250 },
  faqs: { min: 3, max: 5, answerMinWords: 40, answerMaxWords: 60 },
  clientConcerns: { min: 2, max: 3, completeMin: 2 },
} as const;

// --- helpers ----------------------------------------------------------------------------------

/** Whitespace-delimited word count; `""` → 0. Used by validators and the uniqueness gate. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/** Total words across a list of strings. */
export function wordCountAll(texts: readonly string[]): number {
  return texts.reduce((n, t) => n + wordCount(t), 0);
}

const wordRange = (min: number, max: number, label: string) =>
  z.string().check((ctx) => {
    const n = wordCount(ctx.value);
    if (n < min || n > max) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `${label} is ${n} words; must be ${min}–${max}`,
      });
    }
  });

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PATH_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,2}$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** File stem of a research module for a path: `india/maharashtra/mumbai` → `india--maharashtra--mumbai`. */
export const researchStemForPath = (path: string) => path.replaceAll("/", "--");
export const pathForResearchStem = (stem: string) => stem.replaceAll("--", "/");

// --- base record -------------------------------------------------------------------------------

export const locationBaseSchema = z
  .object({
    slug: z.string().regex(SLUG_PATTERN, "slug must be lowercase-hyphenated"),
    path: z.string().regex(PATH_PATTERN, "path must be 1–3 lowercase-hyphenated segments"),
    parentPath: z.string().regex(PATH_PATTERN).nullable(),
    type: z.enum(LOCATION_TYPES),
    name: z.string().min(2),
    shortName: z.string().min(2).optional(),
    countryCode: z.string().regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2"),
    regionCode: z
      .string()
      .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/, "ISO 3166-2")
      .optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    timezone: z.string().refine(isValidTimezone, "invalid IANA timezone"),
    populationTier: z.enum(POPULATION_TIERS),
    languages: z.array(z.string().min(2)).min(1),
    currency: z.enum(LOCATION_CURRENCIES),
    hreflang: z.enum(HREFLANGS).optional(),
    isFeatured: z.boolean().optional(),
    contentUpdatedAt: z.string().regex(ISO_DATE_PATTERN, "YYYY-MM-DD"),
  })
  .superRefine((loc, ctx) => {
    const segments = loc.path.split("/");
    const depth = { country: 1, state: 2, city: 3 }[loc.type];
    if (segments.length !== depth) {
      ctx.addIssue({
        code: "custom",
        path: ["path"],
        message: `${loc.type} must have ${depth} path segment(s), got ${segments.length}`,
      });
    }
    if (segments[segments.length - 1] !== loc.slug) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "path must end in slug" });
    }
    const expectedParent = segments.slice(0, -1).join("/") || null;
    if (loc.parentPath !== expectedParent) {
      ctx.addIssue({
        code: "custom",
        path: ["parentPath"],
        message: `parentPath must be ${expectedParent ?? "null"}`,
      });
    }
    if (loc.hreflang && loc.type !== "country") {
      ctx.addIssue({ code: "custom", path: ["hreflang"], message: "hreflang is countries-only" });
    }
    if (loc.type === "country" && !loc.hreflang) {
      ctx.addIssue({ code: "custom", path: ["hreflang"], message: "countries need hreflang" });
    }
    if (Number.isNaN(Date.parse(loc.contentUpdatedAt))) {
      ctx.addIssue({ code: "custom", path: ["contentUpdatedAt"], message: "invalid date" });
    }
  });

export type LocationBase = z.infer<typeof locationBaseSchema>;

// --- research ---------------------------------------------------------------------------------

export const landmarkSchema = z.object({
  name: z.string().min(2),
  kind: z.enum(LANDMARK_KINDS),
  note: z.string().optional(),
});
export type Landmark = z.infer<typeof landmarkSchema>;

export const locationFaqSchema = z.object({
  question: z.string().min(10).endsWith("?"),
  answer: wordRange(
    RESEARCH_LIMITS.faqs.answerMinWords,
    RESEARCH_LIMITS.faqs.answerMaxWords,
    "faq answer",
  ).refine((s) => s.includes("Astrologer Kavita"), "faq answer must name Astrologer Kavita"),
});
export type LocationFaq = z.infer<typeof locationFaqSchema>;

export const traditionSchema = z.object({
  chartStyle: z.enum(CHART_STYLES),
  calendar: z.string().min(5),
  monthReckoning: z.enum(MONTH_RECKONINGS).optional(),
  birthRecordsNote: z.string().min(20),
  narrative: wordRange(
    RESEARCH_LIMITS.narrative.minWords,
    RESEARCH_LIMITS.narrative.maxWords,
    "tradition.narrative",
  ),
});
export type RegionalTradition = z.infer<typeof traditionSchema>;

export const climateArchitectureSchema = z.object({
  facts: z.array(z.string().min(10)).min(RESEARCH_LIMITS.facts.min).max(RESEARCH_LIMITS.facts.max),
  housingStock: z.string().min(5),
  plotOrientation: z.string().optional(),
  narrative: wordRange(
    RESEARCH_LIMITS.narrative.minWords,
    RESEARCH_LIMITS.narrative.maxWords,
    "climateArchitecture.narrative",
  ),
});
export type ClimateArchitecture = z.infer<typeof climateArchitectureSchema>;

export const locationResearchSchema = z.object({
  landmarks: z
    .array(landmarkSchema)
    .min(RESEARCH_LIMITS.landmarks.min)
    .max(RESEARCH_LIMITS.landmarks.max),
  tradition: traditionSchema,
  climateArchitecture: climateArchitectureSchema,
  opening: z.object({
    astrologer: wordRange(
      RESEARCH_LIMITS.opening.minWords,
      RESEARCH_LIMITS.opening.maxWords,
      "opening.astrologer",
    ),
    vastu: wordRange(
      RESEARCH_LIMITS.opening.minWords,
      RESEARCH_LIMITS.opening.maxWords,
      "opening.vastu",
    ),
  }),
  consultingFrom: wordRange(
    RESEARCH_LIMITS.consultingFrom.minWords,
    RESEARCH_LIMITS.consultingFrom.maxWords,
    "consultingFrom",
  ),
  faqs: z.array(locationFaqSchema).min(RESEARCH_LIMITS.faqs.min).max(RESEARCH_LIMITS.faqs.max),
  /** owner-approved generalisations, reviewed by the practitioner (NEEDS-REAL-DATA §11) (§12). `[]` until Kavita provides them; 2–3 when she does. */
  clientConcerns: z
    .array(z.string().min(5))
    .refine(
      (a) =>
        a.length === 0 ||
        (a.length >= RESEARCH_LIMITS.clientConcerns.min &&
          a.length <= RESEARCH_LIMITS.clientConcerns.max),
      `clientConcerns must be empty or ${RESEARCH_LIMITS.clientConcerns.min}–${RESEARCH_LIMITS.clientConcerns.max} items`,
    ),
  /** Only a real, consented testimonial id — never a placeholder. */
  testimonialId: z.string().min(1).optional(),
});
export type LocationResearch = z.infer<typeof locationResearchSchema>;

/** Shape of a `research/<stem>.ts` module. */
export const researchModuleSchema = z.object({
  research: locationResearchSchema,
  contentUpdatedAt: z.string().regex(ISO_DATE_PATTERN, "YYYY-MM-DD"),
});
export type ResearchModule = z.infer<typeof researchModuleSchema>;

// --- status derivation ------------------------------------------------------------------------

/**
 * The one rule for whether a geo page exists and is indexable. Research that fails its schema
 * counts as absent (stub) so an out-of-range file can never be published by accident.
 */
export function deriveResearchStatus(
  research: LocationResearch | null | undefined,
): ResearchStatus {
  if (!research) return "stub";
  const parsed = locationResearchSchema.safeParse(research);
  if (!parsed.success) return "stub";
  return parsed.data.clientConcerns.length >= RESEARCH_LIMITS.clientConcerns.completeMin
    ? "complete"
    : "partial";
}

// --- full record ------------------------------------------------------------------------------

export const locationRecordSchema = locationBaseSchema
  .safeExtend({
    researchStatus: z.enum(RESEARCH_STATUSES),
    research: locationResearchSchema.optional(),
  })
  .superRefine((rec, ctx) => {
    const expected = deriveResearchStatus(rec.research);
    if (rec.researchStatus !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["researchStatus"],
        message: `researchStatus must be derived: expected ${expected}, got ${rec.researchStatus}`,
      });
    }
  });

export type LocationRecord = z.infer<typeof locationRecordSchema>;

export const isPublishable = (l: Pick<LocationRecord, "researchStatus">) =>
  l.researchStatus === "complete" || l.researchStatus === "partial";
export const isIndexable = (l: Pick<LocationRecord, "researchStatus">) =>
  l.researchStatus === "complete";
