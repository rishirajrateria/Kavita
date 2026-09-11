/**
 * Offline checks of every JSON-LD generator — no database, no test runner.
 *
 *   pnpm test:schema
 *
 * Asserts, for each type: the required properties are present, a valid `@context`, no
 * `undefined` anywhere, no `{{PLACEHOLDER}}` leaking into structured data, FAQPage has ≥1
 * Question with an acceptedAnswer, BreadcrumbList positions run 1..n, speakable carries a
 * cssSelector, and Service emits `offers` only when a real price is supplied.
 */
import type { SiteSettings } from "@/db/schema";
import { SEED_NS, SITE_SETTINGS_KEY, hydrate, siteSettingsSeed } from "@/content/seed";
import { serializeJsonLd } from "@/components/seo/json-ld";
import {
  breadcrumbSchema,
  faqPageSchema,
  localBusinessSchema,
  personSchema,
  placeChain,
  professionalServiceSchema,
  serviceSchema,
  webSiteSchema,
  withSpeakable,
  type Thing,
} from "@/lib/seo/schema";

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);
const check = (ok: boolean, msg: string) => {
  if (!ok) fail(msg);
};

const SITE_URL = "https://example.test";
const settings = hydrate<SiteSettings>(SEED_NS.siteSettings, SITE_SETTINGS_KEY, siteSettingsSeed);
const sameAs = ["https://www.instagram.com/example", "{{YOUTUBE_URL}}"];

/** Walks the object; reports `undefined` values and `{{` placeholders at any depth. */
function walk(value: unknown, path: string, label: string): void {
  if (value === undefined) {
    fail(`${label}: undefined at ${path}`);
    return;
  }
  if (typeof value === "string") {
    if (value.includes("{{")) fail(`${label}: placeholder leaked at ${path}: ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, label));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, label);
  }
}

function common(thing: Thing & { "@context"?: string }, label: string, required: string[]) {
  check(
    thing["@context"] === "https://schema.org",
    `${label}: @context must be https://schema.org`,
  );
  for (const key of required) {
    check(thing[key] !== undefined && thing[key] !== null, `${label}: missing required "${key}"`);
  }
  walk(thing, "$", label);
  // Round-trips through the serializer used by <JsonLd /> without throwing.
  const json = serializeJsonLd(thing);
  check(!json.includes("{{"), `${label}: serialized JSON contains a placeholder`);
  check(!json.includes("undefined"), `${label}: serialized JSON contains "undefined"`);
}

// --- Person ----------------------------------------------------------------------------------
const person = personSchema({ settings, sameAs, siteUrl: SITE_URL });
common(person, "Person", ["@type", "name", "url", "jobTitle", "knowsAbout"]);
check(person["@type"] === "Person", "Person: @type");
check(
  Array.isArray(person.sameAs) && person.sameAs.length === 1,
  "Person: placeholder sameAs entries must be filtered out",
);
check(
  person.name === "Astrologer Kavita",
  "Person: placeholder practitioner name falls back to the brand",
);

// --- ProfessionalService (site-wide) ---------------------------------------------------------
const org = professionalServiceSchema({
  settings,
  sameAs,
  siteUrl: SITE_URL,
  areaServed: ["India", "Singapore"],
});
common(org, "ProfessionalService", ["@type", "@id", "name", "url", "openingHoursSpecification"]);
check(
  Array.isArray(org["@type"]) && org["@type"].includes("LocalBusiness"),
  "ProfessionalService: must also be typed LocalBusiness",
);
check(org.telephone === undefined, "ProfessionalService: placeholder phone must be omitted");
check(org.address === undefined, "ProfessionalService: placeholder address must be omitted");
check(
  (org.openingHoursSpecification ?? []).length >= 1,
  "ProfessionalService: opening hours from business_hours",
);

// --- LocalBusiness bound to a place -----------------------------------------------------------
const place = placeChain([
  { type: "country", name: "India" },
  { type: "state", name: "Maharashtra" },
  { type: "city", name: "Mumbai" },
]);
check(place["@type"] === "City" && place.name === "Mumbai", "placeChain: innermost is the city");
check(
  place.containedInPlace?.["@type"] === "State" &&
    place.containedInPlace.containedInPlace?.["@type"] === "Country",
  "placeChain: City → State → Country nesting",
);
const local = localBusinessSchema({
  settings,
  sameAs,
  siteUrl: SITE_URL,
  place,
  pageUrl: `${SITE_URL}/astrologer/india/maharashtra/mumbai`,
});
common(local, "LocalBusiness", ["@type", "@id", "name", "url", "areaServed"]);
check(
  Array.isArray(local.areaServed) && local.areaServed[0]?.["@type"] === "City",
  "LocalBusiness: areaServed is the page's City",
);
check(local["@id"] === org["@id"], "LocalBusiness: same @id as the site-wide organisation");

// --- Service ---------------------------------------------------------------------------------
const serviceNoPrice = serviceSchema({
  name: "Vedic astrology consultation in Mumbai",
  serviceType: "Vedic astrology consultation",
  description: "{{PRICE}}",
  url: `${SITE_URL}/astrologer/india/maharashtra/mumbai`,
  siteUrl: SITE_URL,
  areaServed: [place],
  channels: ["online_video", "online_phone"],
});
common(serviceNoPrice, "Service", ["@type", "name", "serviceType", "provider", "areaServed"]);
check(serviceNoPrice.offers === undefined, "Service: no offers without a real price");
check(serviceNoPrice.description === undefined, "Service: placeholder description omitted");
check(
  (serviceNoPrice.availableChannel ?? []).length === 2,
  "Service: channels map to ServiceChannel nodes",
);

const servicePriced = serviceSchema({
  name: "Vastu consultation in Dubai",
  serviceType: "Vastu consultation",
  siteUrl: SITE_URL,
  areaServed: [placeChain([{ type: "country", name: "United Arab Emirates" }])],
  offers: [
    { amountMinor: 50000, currency: "AED" },
    { amountMinor: 0, currency: "INR" },
  ],
});
common(servicePriced, "Service(priced)", ["@type", "name", "serviceType", "provider"]);
check(
  servicePriced.offers?.length === 1 &&
    servicePriced.offers[0]?.price === "500.00" &&
    servicePriced.offers[0]?.priceCurrency === "AED",
  "Service: only positive real prices become Offers, in major units",
);

// --- WebSite ---------------------------------------------------------------------------------
const site = webSiteSchema({ siteUrl: SITE_URL, name: "Astrologer Kavita" });
common(site, "WebSite", ["@type", "name", "url", "potentialAction"]);

// --- FAQPage + speakable -----------------------------------------------------------------------
const faq = withSpeakable(
  faqPageSchema([
    { question: "Is vastu applicable to apartments?", answer: "Yes — Astrologer Kavita reads…" },
  ]),
  [".answer"],
);
common(faq, "FAQPage", ["@type", "mainEntity", "speakable"]);
const questions = faq.mainEntity;
check(questions.length >= 1, "FAQPage: at least one Question");
check(
  questions.every(
    (q) =>
      q["@type"] === "Question" &&
      typeof q.name === "string" &&
      (q.acceptedAnswer as Thing | undefined)?.["@type"] === "Answer" &&
      typeof (q.acceptedAnswer as Thing).text === "string",
  ),
  "FAQPage: every Question has a name and an acceptedAnswer Answer with text",
);
const speakable = faq.speakable;
check(
  speakable["@type"] === "SpeakableSpecification" &&
    Array.isArray(speakable.cssSelector) &&
    speakable.cssSelector.includes(".answer"),
  "speakable: SpeakableSpecification with the .answer cssSelector",
);
check(faqPageSchema([]).mainEntity.length === 0, "FAQPage: empty input yields empty mainEntity");

// --- BreadcrumbList -----------------------------------------------------------------------------
const crumbs = breadcrumbSchema(
  [
    { name: "Home", href: "/" },
    { name: "India", href: "/astrologer/india" },
    { name: "Mumbai", href: `${SITE_URL}/astrologer/india/maharashtra/mumbai` },
  ],
  SITE_URL,
);
common(crumbs, "BreadcrumbList", ["@type", "itemListElement"]);
const positions = crumbs.itemListElement.map((i) => i.position);
check(
  positions.every((p, i) => p === i + 1),
  `BreadcrumbList: positions must be 1..n, got ${positions.join(",")}`,
);
check(
  crumbs.itemListElement.every((i) => typeof i.item === "string" && /^https?:\/\//.test(i.item)),
  "BreadcrumbList: every item is an absolute URL",
);

// --- Report ------------------------------------------------------------------------------------
if (failures.length) {
  console.error(`schema.test: ${failures.length} failure(s)\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("schema.test: all JSON-LD generators OK");
