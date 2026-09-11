/**
 * Practitioner facts used by the E-E-A-T byline, `/about` and the Person schema (CLAUDE.md §8
 * E-E-A-T, §9.9, §12). EVERY value here is unfilled client data — a `{{PLACEHOLDER}}` string or
 * an empty list — and each one is listed in NEEDS-REAL-DATA.md §10. Nothing may be invented:
 * a credential, a year or a count appears on the site only when the practitioner supplies it.
 *
 * Her name, city, country and contact details live in `site_settings` (`getSiteSettings()`),
 * not here; this file holds only what the settings table has no column for.
 */
import { isPlaceholder, realValue } from "@/lib/site";

export interface Credential {
  /** Row label in the `/about` credentials list. */
  readonly label: string;
  /** The credential itself — a `{{PLACEHOLDER}}` until supplied. */
  readonly value: string;
  /** Where it is used on the site, for the client's data sheet. */
  readonly usedFor: string;
}

export const PRACTITIONER = {
  /** Generic descriptor; the only line here that is not a placeholder. */
  jobTitle: "Vedic astrologer and vastu consultant",

  /** Formal qualifications, in the order they are listed on `/about`. */
  credentials: [
    {
      label: "Astrology qualification",
      value: "{{CREDENTIAL_ASTROLOGY}}",
      usedFor: "formal Jyotish qualification (e.g. Jyotish Visharad), awarding body and year",
    },
    {
      label: "Vastu training",
      value: "{{CREDENTIAL_VASTU}}",
      usedFor: "formal vastu shastra training, institution and year",
    },
    {
      label: "Lineage",
      value: "{{LINEAGE}}",
      usedFor: "guru or parampara under whom she studied, if any",
    },
    {
      label: "Institutions",
      value: "{{INSTITUTIONS}}",
      usedFor:
        "colleges, academies or boards attended — also used for the Person schema alumniOf field",
    },
  ] as const satisfies readonly Credential[],

  /** Years in practice — `{{YEARS}}` in the brief. */
  yearsOfPractice: "{{YEARS}}",
  /** The year the practice began — `{{YEAR}}` in the brief. */
  startedYear: "{{YEAR}}",
  /** Integrated consultations completed — `{{N}}`; only a real number may ever replace it. */
  consultationsCompleted: "{{N}}",
  /** Percentage of clients outside India — `{{X}}`; only a real number may ever replace it. */
  clientsOutsideIndiaPercent: "{{X}}",
  /** Languages she consults in — `{{e.g. English, Hindi, Bengali}}` in the brief. */
  languages: "{{LANGUAGES OF CONSULTATION}}",

  /**
   * Verifiable awards and institutions for the Person schema. Empty until real; the schema
   * omits `award` / `alumniOf` entirely while these are empty (never placeholders in JSON-LD).
   */
  awards: [] as readonly string[],
  alumniOf: [] as readonly string[],

  /** Portrait: the labelled placeholder until `{{PRACTITIONER PHOTO}}` arrives. */
  photo: {
    src: "/images/kavita-placeholder.svg",
    width: 480,
    height: 600,
    alt: (name: string) =>
      `Placeholder portrait. A real photograph of ${name}, Astrologer Kavita, will replace this image.`,
  },
} as const;

/** Credentials whose value has been supplied (no `{{…}}`). */
export function realCredentials(): Credential[] {
  return PRACTITIONER.credentials.filter((c) => realValue(c.value) !== undefined);
}

/** Credentials still awaiting the practitioner's data. */
export function pendingCredentials(): Credential[] {
  return PRACTITIONER.credentials.filter((c) => isPlaceholder(c.value));
}

/**
 * One line for author bylines: the real credentials joined, or — while every credential is a
 * placeholder — the plain job title, so bylines on every content page stay free of template
 * text. `/about` lists the pending placeholders explicitly instead.
 */
export function credentialLine(): string {
  const real = realCredentials()
    .filter((c) => c.label !== "Institutions")
    .map((c) => c.value);
  return real.length ? `${PRACTITIONER.jobTitle} · ${real.join(" · ")}` : PRACTITIONER.jobTitle;
}

/** `alumniOf` for the Person schema — only real institutions, never a placeholder. */
export function realAlumniOf(): string[] {
  return PRACTITIONER.alumniOf.filter((a) => realValue(a) !== undefined);
}

/** `award` for the Person schema — only real awards, never a placeholder. */
export function realAwards(): string[] {
  return PRACTITIONER.awards.filter((a) => realValue(a) !== undefined);
}

/** Years of practice as a sentence fragment, or `undefined` while it is a placeholder. */
export function realYearsOfPractice(): string | undefined {
  return realValue(PRACTITIONER.yearsOfPractice);
}
