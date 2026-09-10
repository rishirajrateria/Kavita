/**
 * Offline validation of every seed record — no database, no test runner.
 *
 *   pnpm test:seed
 *
 * Fails (exit 1) on any violation. Placeholders (`{{…}}`) are allowed but every one must be
 * listed in NEEDS-REAL-DATA.md so nothing unfilled can be forgotten.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  CURRENCIES,
  INTEGRATION_PROVIDERS,
  LOCATION_TYPES,
  RESEARCH_STATUSES,
  SERVICE_LEADS,
  SOCIAL_PLATFORMS,
} from "@/db/schema";
import { PLACEHOLDER_MARKER, PLACEHOLDER_TESTIMONIALS } from "@/content/PLACEHOLDERS";
import {
  PLACEHOLDER_PATTERN,
  SEED_CONTENT_UPDATED_AT,
  faqsSeed,
  integrationsSeed,
  locationId,
  locationsSeed,
  servicesSeed,
  siteSettingsSeed,
  socialLinksSeed,
  stableId,
} from "@/content/seed";

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);
const check = (ok: boolean, msg: string) => {
  if (!ok) fail(msg);
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const OUTCOME_CLAIMS = /\b(guarantee[ds]?|100%|cure[sd]?|accurate prediction|will definitely)\b/i;

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const words = (s: string) => s.trim().split(/\s+/).length;

function report(label: string, result: z.ZodSafeParseResult<unknown>) {
  if (!result.success) fail(`${label}: ${z.prettifyError(result.error)}`);
}

// --- site_settings --------------------------------------------------------------------------

const businessHoursInterval = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
});
const siteSettingsSchema = z.object({
  brandName: z.literal("Astrologer Kavita"),
  legalEntity: z.string().min(1),
  practitionerName: z.string().min(1),
  tagline: z.string().min(10),
  phone: z.string().min(1),
  whatsapp: z.string().min(1),
  email: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  timezone: z.string().refine(isValidTimezone, "invalid IANA timezone"),
  defaultCurrency: z.enum(CURRENCIES),
  businessHours: z.record(
    z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    z.array(businessHoursInterval).nullable(),
  ),
  inPersonAvailable: z.boolean(),
  responseTimeHours: z.number().int().positive(),
});
report("site_settings", siteSettingsSchema.safeParse(siteSettingsSeed));

// --- social_links ---------------------------------------------------------------------------

const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  showInFooter: z.boolean(),
  showInHeader: z.boolean(),
  includeInSameas: z.boolean(),
});
report("social_links", z.array(socialLinkSchema).min(1).safeParse(socialLinksSeed));
check(
  new Set(socialLinksSeed.map((l) => l.url)).size === socialLinksSeed.length,
  "social_links: urls must be unique",
);
const placeholderSocialUrls = socialLinksSeed.filter((l) => PLACEHOLDER_PATTERN.test(l.url));
for (const l of socialLinksSeed) {
  if (!PLACEHOLDER_PATTERN.test(l.url)) {
    check(z.url().safeParse(l.url).success, `social_links: ${l.platform} url is not a valid URL`);
  }
}

// --- integrations ---------------------------------------------------------------------------

report(
  "integrations",
  z
    .array(
      z.object({
        provider: z.enum(INTEGRATION_PROVIDERS),
        config: z.record(z.string(), z.unknown()),
        isEnabled: z.literal(false),
        loadsInRegions: z.array(z.string()),
      }),
    )
    .length(INTEGRATION_PROVIDERS.length)
    .safeParse(integrationsSeed),
);
check(
  new Set(integrationsSeed.map((i) => i.provider)).size === INTEGRATION_PROVIDERS.length,
  "integrations: every provider exactly once",
);

// --- services -------------------------------------------------------------------------------

const serviceSchema = z.object({
  slug: z.string().regex(SLUG, "slug must be lowercase-hyphenated"),
  name: z.string().min(3),
  lead: z.enum(SERVICE_LEADS),
  durationMinutes: z.number().int().positive(),
  bufferBeforeMinutes: z.number().int().nonnegative(),
  bufferAfterMinutes: z.number().int().nonnegative(),
  priceMinor: z.number().int().nonnegative().nullable(),
  currency: z.enum(CURRENCIES).nullable(),
  prices: z.partialRecord(z.enum(CURRENCIES), z.number().int().nonnegative()),
  priceNote: z.string().nullable(),
  shortDescription: z.string().min(40),
  description: z.string().min(150),
  whatToPrepare: z.array(z.string().min(5)).min(1),
  whatYouReceive: z.array(z.string().min(5)).min(1),
  deliveryModes: z
    .array(z.enum(["online_video", "online_phone", "in_person", "floor_plan"]))
    .min(1),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
report("services", z.array(serviceSchema).min(1).safeParse(servicesSeed));
check(
  new Set(servicesSeed.map((s) => s.slug)).size === servicesSeed.length,
  "services: slugs unique",
);
for (const s of servicesSeed) {
  check(
    !OUTCOME_CLAIMS.test(`${s.shortDescription} ${s.description}`),
    `services/${s.slug}: copy contains an outcome claim (§12)`,
  );
  check(
    s.priceMinor !== null || s.priceNote !== null,
    `services/${s.slug}: needs a price or a price note`,
  );
}

// --- locations ------------------------------------------------------------------------------

const locationSchema = z.object({
  parentId: z.string().regex(UUID).nullable(),
  type: z.enum(LOCATION_TYPES),
  name: z.string().min(2),
  slug: z.string().regex(SLUG),
  path: z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/),
  isoCountry: z.string().regex(/^[A-Z]{2}$/),
  isoRegion: z
    .string()
    .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
    .nullable(),
  lat: z.string().regex(/^-?\d{1,2}\.\d{1,6}$/),
  lng: z.string().regex(/^-?\d{1,3}\.\d{1,6}$/),
  timezone: z.string().refine(isValidTimezone, "invalid IANA timezone"),
  languages: z.array(z.string().min(2)).min(1),
  currency: z.enum(CURRENCIES),
  researchStatus: z.enum(RESEARCH_STATUSES),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});
report("locations", z.array(locationSchema).min(1).safeParse(locationsSeed));
const seenPaths = new Set<string>();
for (const l of locationsSeed) {
  check(!seenPaths.has(l.path), `locations/${l.path}: duplicate path`);
  seenPaths.add(l.path);
  const segments = l.path.split("/");
  check(segments[segments.length - 1] === l.slug, `locations/${l.path}: path must end in slug`);
  const depth = { country: 1, state: 2, city: 3 }[l.type];
  check(
    segments.length === depth,
    `locations/${l.path}: ${l.type} must have ${depth} path segments`,
  );
  const parentPath = segments.slice(0, -1).join("/");
  if (parentPath) {
    check(
      seenPaths.has(parentPath),
      `locations/${l.path}: parent ${parentPath} must be seeded first`,
    );
    check(
      l.parentId === locationId(parentPath),
      `locations/${l.path}: parentId must be stableId(parent)`,
    );
  } else {
    check(l.parentId === null, `locations/${l.path}: country must have no parent`);
  }
  check(
    Math.abs(Number(l.lat)) <= 90 && Math.abs(Number(l.lng)) <= 180,
    `locations/${l.path}: bad coords`,
  );
  // Phase 1 rule: no research fields, no publishing, until Phase 2 researches the location.
  check(
    l.researchStatus === "stub" && !l.isPublished,
    `locations/${l.path}: Phase 1 rows must be unpublished stubs`,
  );
  check(
    l.landmarks === null &&
      l.tradition === null &&
      l.climateArchitecture === null &&
      l.faqs === null,
    `locations/${l.path}: research fields must stay empty until researched (§7, §12)`,
  );
}

// --- faqs -----------------------------------------------------------------------------------

report(
  "faqs",
  z
    .array(
      z.object({
        routePattern: z.string().startsWith("/").nullable(),
        locationId: z.string().regex(UUID).nullable(),
        question: z.string().endsWith("?"),
        answer: z.string().min(1),
        sortOrder: z.number().int(),
        isPublished: z.boolean(),
      }),
    )
    .min(1)
    .safeParse(faqsSeed),
);
for (const f of faqsSeed) {
  const n = words(f.answer);
  check(
    n >= 40 && n <= 60,
    `faqs "${f.question.slice(0, 40)}…": answer is ${n} words, must be 40–60`,
  );
  check(
    f.answer.includes("Astrologer Kavita"),
    `faqs "${f.question.slice(0, 40)}…": answer must name Astrologer Kavita`,
  );
  check(!OUTCOME_CLAIMS.test(f.answer), `faqs "${f.question.slice(0, 40)}…": outcome claim (§12)`);
  check(
    !/[$₹£]|\bAED\b|\bINR\b/.test(f.answer),
    `faqs "${f.question.slice(0, 40)}…": no prices in answers`,
  );
}

// --- placeholders ---------------------------------------------------------------------------

check(
  PLACEHOLDER_TESTIMONIALS.length === 3,
  "PLACEHOLDERS: expected exactly 3 placeholder testimonials",
);
for (const t of PLACEHOLDER_TESTIMONIALS) {
  check(
    t.isPlaceholder && !t.isPublished && !t.consentGiven,
    "PLACEHOLDERS: must be unpublished, unconsented placeholders",
  );
  check(
    t.quote.includes(PLACEHOLDER_MARKER),
    "PLACEHOLDERS: quote must contain PLACEHOLDER_MARKER",
  );
  check(
    PLACEHOLDER_PATTERN.test(PLACEHOLDER_MARKER),
    "PLACEHOLDER_MARKER must match the {{…}} pattern",
  );
  check(t.rating === null, "PLACEHOLDERS: never carry a rating");
}

// --- stable ids -----------------------------------------------------------------------------

check(UUID.test(stableId("services", "kundli-analysis")), "stableId must produce a v5-shaped UUID");
check(
  stableId("a", "b") === stableId("a", "b") && stableId("a", "b") !== stableId("a", "c"),
  "stableId must be deterministic",
);
check(
  !Number.isNaN(SEED_CONTENT_UPDATED_AT.getTime()),
  "SEED_CONTENT_UPDATED_AT must be a valid date",
);

// --- every placeholder token must be tracked in NEEDS-REAL-DATA.md --------------------------

const needsRealData = readFileSync(join(process.cwd(), "NEEDS-REAL-DATA.md"), "utf8");
const seedText = JSON.stringify({
  siteSettingsSeed,
  socialLinksSeed,
  servicesSeed,
  faqsSeed,
  locationsSeed,
});
const tokens = new Set(seedText.match(/\{\{[^}]*\}\}/g) ?? []);
for (const token of tokens) {
  check(needsRealData.includes(token), `placeholder ${token} is not listed in NEEDS-REAL-DATA.md`);
}

// --- result ---------------------------------------------------------------------------------

console.log(
  `Checked ${servicesSeed.length} services, ${locationsSeed.length} locations, ${faqsSeed.length} FAQs, ` +
    `${socialLinksSeed.length} social links (${placeholderSocialUrls.length} placeholder URLs), ` +
    `${integrationsSeed.length} integrations, ${tokens.size} placeholder tokens.`,
);
if (placeholderSocialUrls.length > 0) {
  console.log(
    `Flagged placeholder social URLs (tracked in NEEDS-REAL-DATA.md): ${placeholderSocialUrls
      .map((l) => l.platform)
      .join(", ")}`,
  );
}
if (failures.length > 0) {
  console.error(`\n${failures.length} seed-content failure(s):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log("Seed content OK.");
