/**
 * Content validation gate (CLAUDE.md §7 "VALIDATION GATE", §12). Runs as `pnpm validate:content`
 * and as `prebuild`, and in CI. Exit 1 on any failure.
 *
 *   (a) every location record's `researchStatus` matches what its research supports, and every
 *       complete/partial record passes the research schema (RESEARCH_LIMITS);
 *   (b) every publishable location × service page has ≥ 700 words of location-specific text
 *       and no two pages exceed 60% 5-gram shingle Jaccard similarity;
 *   (c) production builds fail while placeholder testimonials or `{{PLACEHOLDER}}` text would
 *       render; elsewhere these are warnings with counts;
 *   (d) a report of pages live / held back (noindex) / stub (404) with the reason per location.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RESEARCH_LIMITS,
  deriveResearchStatus,
  getLocationRecords,
  loadResearch,
  locationResearchSchema,
  wordCount,
  type LocationRecord,
} from "@/content/locations";
import { PLACEHOLDER_MARKER } from "@/content/PLACEHOLDERS";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { GEO_SERVICES, type GeoService } from "@/lib/data/types";
import { getGeoPageText } from "@/lib/geo/copy";
import { z } from "zod";

const MIN_WORDS = 700;
const MAX_SIMILARITY = 0.6;
const SHINGLE_SIZE = 5;
const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const failures: string[] = [];
const warnings: string[] = [];
const fail = (msg: string) => failures.push(msg);
const warn = (msg: string) => warnings.push(msg);

// --- similarity ------------------------------------------------------------------------------

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Set of hashed 5-word shingles; numbers are cheaper to hash than joined strings. */
export function shingles(text: string, size = SHINGLE_SIZE): Set<string> {
  const words = tokenize(text);
  const out = new Set<string>();
  for (let i = 0; i + size <= words.length; i += 1) {
    out.add(words.slice(i, i + size).join(" "));
  }
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const s of small) if (large.has(s)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/** Upper bound of Jaccard from sizes alone: |small| / |large|. Skips hopeless pairs cheaply. */
export function jaccardUpperBound(a: Set<string>, b: Set<string>): number {
  const large = Math.max(a.size, b.size);
  return large === 0 ? 0 : Math.min(a.size, b.size) / large;
}

// --- (a) research status ---------------------------------------------------------------------

async function checkResearch(records: LocationRecord[]) {
  const { problems } = await loadResearch();
  for (const p of problems) fail(`research/${p.stem}.ts: ${p.message}`);

  for (const rec of records) {
    const expected = deriveResearchStatus(rec.research);
    if (rec.researchStatus !== expected) {
      fail(
        `${rec.path}: researchStatus is "${rec.researchStatus}" but research supports "${expected}"`,
      );
    }
    if (rec.researchStatus === "stub") continue;
    const parsed = locationResearchSchema.safeParse(rec.research);
    if (!parsed.success) {
      fail(`${rec.path}: research violates RESEARCH_LIMITS:\n${z.prettifyError(parsed.error)}`);
      continue;
    }
    if (
      rec.researchStatus === "complete" &&
      parsed.data.clientConcerns.length < RESEARCH_LIMITS.clientConcerns.completeMin
    ) {
      fail(
        `${rec.path}: complete without ${RESEARCH_LIMITS.clientConcerns.completeMin} client concerns`,
      );
    }
  }
}

// --- (b) length + uniqueness -----------------------------------------------------------------

interface PageText {
  key: string;
  service: GeoService;
  record: LocationRecord;
  text: string;
  words: number;
  shingles: Set<string>;
}

function collectPages(records: LocationRecord[]): PageText[] {
  const pages: PageText[] = [];
  for (const record of records) {
    if (record.researchStatus === "stub") continue;
    for (const service of GEO_SERVICES) {
      const text = getGeoPageText(record, service);
      pages.push({
        key: `/${service}/${record.path}`,
        service,
        record,
        text,
        words: wordCount(text),
        shingles: shingles(text),
      });
    }
  }
  return pages;
}

function checkPages(pages: PageText[]) {
  for (const p of pages) {
    if (p.words < MIN_WORDS)
      fail(`${p.key}: ${p.words} words of location-specific copy (< ${MIN_WORDS})`);
  }

  const scored: { a: string; b: string; score: number }[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    const a = pages[i];
    if (!a) continue;
    for (let j = i + 1; j < pages.length; j += 1) {
      const b = pages[j];
      if (!b) continue;
      if (jaccardUpperBound(a.shingles, b.shingles) <= MAX_SIMILARITY) continue;
      scored.push({ a: a.key, b: b.key, score: jaccard(a.shingles, b.shingles) });
    }
  }
  scored.sort((x, y) => y.score - x.score);
  for (const pair of scored) {
    if (pair.score > MAX_SIMILARITY) {
      fail(
        `${pair.a} vs ${pair.b}: ${(pair.score * 100).toFixed(1)}% similar (> ${MAX_SIMILARITY * 100}%)`,
      );
    }
  }
  const top = scored.slice(0, 10);
  console.log(
    "\nMost similar page pairs (5-gram Jaccard; pairs whose size bound is ≤ 60% are skipped):",
  );
  if (top.length === 0) console.log("  none — every pair is ruled out by the size pre-check");
  for (const pair of top)
    console.log(`  ${(pair.score * 100).toFixed(1).padStart(5)}%  ${pair.a}  ~  ${pair.b}`);
}

// --- (c) placeholders ------------------------------------------------------------------------

async function checkPlaceholders(pages: PageText[]) {
  const testimonials = await getPublishedTestimonials();
  const placeholderTestimonials = testimonials.filter(
    (t) => t.isPlaceholder || t.quote.includes(PLACEHOLDER_MARKER),
  ).length;
  const geoWithPlaceholders = pages.filter((p) => p.text.includes("{{")).map((p) => p.key);
  const homeSource = readFileSync(join(process.cwd(), "src/content/home.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/^\s*\/\/.*$/gm, ""); // line comments
  const homePlaceholders = homeSource.match(/\{\{[^}]*\}\}/g) ?? [];

  const report = (msg: string) => (IS_PRODUCTION ? fail(msg) : warn(msg));
  if (placeholderTestimonials > 0) {
    report(
      `${placeholderTestimonials} placeholder testimonial(s) would render (supply real, consented ones)`,
    );
  }
  if (geoWithPlaceholders.length > 0) {
    report(
      `{{PLACEHOLDER}} text in ${geoWithPlaceholders.length} geo page(s): ${geoWithPlaceholders.slice(0, 5).join(", ")}`,
    );
  }
  if (homePlaceholders.length > 0) {
    report(
      `${homePlaceholders.length} {{PLACEHOLDER}}(s) in src/content/home.ts: ${[...new Set(homePlaceholders)].join(", ")}`,
    );
  }
}

// --- (d) report ------------------------------------------------------------------------------

function holdBackReason(rec: LocationRecord): string {
  if (rec.researchStatus === "stub") return "no research file";
  const n = rec.research?.clientConcerns.length ?? 0;
  return `clientConcerns: ${n}/${RESEARCH_LIMITS.clientConcerns.completeMin} (practitioner to review)`;
}

function printReport(records: LocationRecord[], pages: PageText[]) {
  const complete = records.filter((r) => r.researchStatus === "complete");
  const partial = records.filter((r) => r.researchStatus === "partial");
  const stub = records.filter((r) => r.researchStatus === "stub");
  console.log("\nGeo page report");
  console.log(`  locations: ${records.length}  pages checked: ${pages.length}`);
  console.log(
    `  live (complete, indexable):  ${complete.length} locations → ${complete.length * GEO_SERVICES.length} pages`,
  );
  console.log(
    `  held back (partial, noindex): ${partial.length} locations → ${partial.length * GEO_SERVICES.length} pages`,
  );
  console.log(`  stub (404, not generated):    ${stub.length} locations`);
  if (partial.length > 0) {
    console.log("  held back:");
    for (const r of partial) console.log(`    - ${r.path}: ${holdBackReason(r)}`);
  }
  if (stub.length > 0) {
    const sample = stub.slice(0, 12).map((r) => r.path);
    const more = stub.length > sample.length ? `, … (${stub.length - sample.length} more)` : "";
    console.log(`  stubs (no research file yet): ${sample.join(", ")}${more}`);
  }
}

// --- main ------------------------------------------------------------------------------------

async function main() {
  const started = performance.now();
  const records = await getLocationRecords();
  await checkResearch(records);
  const pages = collectPages(records);
  checkPages(pages);
  await checkPlaceholders(pages);
  printReport(records, pages);

  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const f of failures) console.error(`FAIL  ${f}`);
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  if (failures.length > 0) {
    console.error(`\nvalidate:content failed with ${failures.length} problem(s) in ${seconds}s`);
    process.exit(1);
  }
  console.log(`\nvalidate:content passed (${warnings.length} warning(s)) in ${seconds}s`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
