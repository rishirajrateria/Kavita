/**
 * Glossary: exactly 25 terms, unique slugs, `short` ≤ 40 words, `definition` 80–150 words,
 * related terms resolve, both categories present, dates well-formed, no outcome promises.
 */
import { GLOSSARY } from "@/content/glossary";
import {
  getArticlesForTerm,
  getGlossaryTerm,
  getGlossaryTerms,
  getRelatedTerms,
} from "@/lib/articles";
import { check, equal } from "./_assert.mjs";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const REQUIRED = [
  "kundli",
  "dasha",
  "antardasha",
  "sade-sati",
  "brahmasthan",
  "ishaan",
  "agneya",
  "nairutya",
  "vayavya",
  "rashi",
  "nakshatra",
  "lagna",
  "navamsa",
  "muhurat",
  "manglik",
  "gochar",
  "yoga",
  "drishti",
  "marma-sthan",
  "vastu-purusha-mandala",
  "ayanamsa",
  "bhava",
  "graha",
  "mahadasha",
  "panchang",
];

export function run(): void {
  equal(GLOSSARY.length, 25, "glossary has 25 terms");
  equal(new Set(GLOSSARY.map((t) => t.slug)).size, GLOSSARY.length, "glossary slugs unique");
  for (const slug of REQUIRED) {
    check(getGlossaryTerm(slug) !== undefined, `glossary has "${slug}"`);
  }
  for (const t of GLOSSARY) {
    check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug), `${t.slug}: slug format`);
    check(words(t.short) <= 40, `${t.slug}: short ≤ 40 words (${words(t.short)})`);
    const d = words(t.definition);
    check(d >= 80 && d <= 150, `${t.slug}: definition 80–150 words (${d})`);
    check(/^\d{4}-\d{2}-\d{2}$/.test(t.dateModified), `${t.slug}: dateModified YYYY-MM-DD`);
    check(t.relatedTerms.length >= 1, `${t.slug}: has related terms`);
    check(!t.relatedTerms.includes(t.slug), `${t.slug}: not related to itself`);
    equal(getRelatedTerms(t).length, t.relatedTerms.length, `${t.slug}: related terms resolve`);
    check(!/guarantee|cure|100%/i.test(t.definition + t.short), `${t.slug}: no outcome claims`);
    check(!/\{\{/.test(t.definition + t.short), `${t.slug}: no placeholders`);
  }
  check(getGlossaryTerms("astrology").length >= 15, "astrology terms present");
  check(getGlossaryTerms("vastu").length >= 6, "vastu terms present");
  const sorted = getGlossaryTerms().map((t) => t.term);
  equal(
    sorted.join("|"),
    [...sorted].sort((a, b) => a.localeCompare(b, "en")).join("|"),
    "getGlossaryTerms alphabetical",
  );
  check(getArticlesForTerm("kundli").length >= 1, "kundli is used in at least one article");
  equal(getArticlesForTerm("no-such-term").length, 0, "unknown term has no articles");
}
