/**
 * Typed JSON-LD generators (CLAUDE.md §8). Every generator returns a plain object built from
 * real data passed in — nothing is hardcoded and nothing is invented. Fields whose value is
 * still a `{{PLACEHOLDER}}` are omitted rather than emitted, so search engines never see
 * template text. Render with `<JsonLd data={…} />`.
 */
import type { BusinessHours, SiteSettings, Weekday } from "@/lib/data/types";
import { realValue } from "@/lib/site";

// ---------------------------------------------------------------------------------------------
// Minimal schema.org typings — enough for type-safe construction, no schema-dts dependency.
// ---------------------------------------------------------------------------------------------

export type SchemaValue = string | number | boolean | null | undefined | SchemaValue[] | Thing;

export interface Thing {
  "@type": string | string[];
  "@id"?: string;
  [key: string]: SchemaValue;
}

export type WithContext<T extends Thing> = T & { "@context": "https://schema.org" };

export interface PostalAddress extends Thing {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface OpeningHoursSpecification extends Thing {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export interface Person extends Thing {
  "@type": "Person";
  name: string;
  alternateName?: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  knowsAbout?: string[];
  knowsLanguage?: string[];
  alumniOf?: SchemaValue;
  award?: SchemaValue;
  sameAs?: string[];
  worksFor?: Thing;
}

export interface ProfessionalService extends Thing {
  "@type": ["ProfessionalService", "LocalBusiness"];
  name: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: PostalAddress;
  areaServed?: Thing[];
  openingHoursSpecification?: OpeningHoursSpecification[];
  priceRange?: string;
  sameAs?: string[];
  founder?: Thing;
  employee?: Thing;
  description?: string;
  image?: string;
}

export interface WebSite extends Thing {
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction: Thing;
  publisher?: Thing;
}

export interface FaqPage extends Thing {
  "@type": "FAQPage";
  mainEntity: Thing[];
}

export interface BreadcrumbList extends Thing {
  "@type": "BreadcrumbList";
  itemListElement: Thing[];
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

const CONTEXT = "https://schema.org" as const;

export const SCHEMA_IDS = {
  person: "#person",
  organization: "#organization",
  website: "#website",
} as const;

export function schemaId(siteUrl: string, key: keyof typeof SCHEMA_IDS): string {
  return `${siteUrl}/${SCHEMA_IDS[key]}`;
}

/** Wrap a Thing with `@context`. */
export function withContext<T extends Thing>(thing: T): WithContext<T> {
  return { "@context": CONTEXT, ...thing };
}

/** Remove `undefined` values so the emitted JSON is clean (JSON.stringify would drop them anyway,
 *  but this keeps snapshots and equality checks predictable). */
function compact<T extends Thing>(thing: T): T {
  const out: Record<string, SchemaValue> = {};
  for (const [key, value] of Object.entries(thing)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

const DAY_OF_WEEK: Record<Weekday, string> = {
  mon: "https://schema.org/Monday",
  tue: "https://schema.org/Tuesday",
  wed: "https://schema.org/Wednesday",
  thu: "https://schema.org/Thursday",
  fri: "https://schema.org/Friday",
  sat: "https://schema.org/Saturday",
  sun: "https://schema.org/Sunday",
};

/** Convert the `site_settings.business_hours` JSON into `OpeningHoursSpecification` entries,
 *  grouping days that share the same interval. */
export function openingHoursFromBusinessHours(hours: BusinessHours): OpeningHoursSpecification[] {
  const groups = new Map<string, OpeningHoursSpecification>();
  for (const day of Object.keys(DAY_OF_WEEK) as Weekday[]) {
    const intervals = hours[day];
    if (!intervals) continue;
    for (const interval of intervals) {
      const key = `${interval.open}-${interval.close}`;
      const existing = groups.get(key);
      if (existing) {
        existing.dayOfWeek.push(DAY_OF_WEEK[day]);
      } else {
        groups.set(key, {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [DAY_OF_WEEK[day]],
          opens: interval.open,
          closes: interval.close,
        });
      }
    }
  }
  return [...groups.values()];
}

export function postalAddressFromSettings(settings: SiteSettings): PostalAddress | undefined {
  const street = [realValue(settings.addressLine1), realValue(settings.addressLine2)]
    .filter(Boolean)
    .join(", ");
  const address = compact<PostalAddress>({
    "@type": "PostalAddress",
    streetAddress: street || undefined,
    addressLocality: realValue(settings.city),
    addressRegion: realValue(settings.addressRegion),
    postalCode: realValue(settings.addressPostalCode),
    addressCountry: realValue(settings.country),
  });
  // Only emit an address when at least one real component exists.
  return Object.keys(address).length > 1 ? address : undefined;
}

// ---------------------------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------------------------

/** What the practice knows about — subjects of the practice, not credentials. */
export const KNOWS_ABOUT = [
  "Vedic astrology",
  "Vastu shastra",
  "Kundli (birth chart) analysis",
  "Kundli milan (horoscope matching)",
  "Muhurat (auspicious timing)",
  "Vimshottari dasha",
  "Residential and commercial vastu",
] as const;

export interface PersonSchemaInput {
  settings: SiteSettings;
  sameAs: string[];
  siteUrl: string;
  imageUrl?: string;
  /** Only pass when the practitioner has supplied real institutions. */
  alumniOf?: string[];
  /** Only pass when the practitioner has supplied real awards. */
  awards?: string[];
  languages?: string[];
}

export function personSchema(input: PersonSchemaInput): WithContext<Person> {
  const { settings, siteUrl } = input;
  const sameAs = input.sameAs.filter((u) => !u.includes("{{"));
  const practitioner = realValue(settings.practitionerName);
  return withContext(
    compact<Person>({
      "@type": "Person",
      "@id": schemaId(siteUrl, "person"),
      name: practitioner ?? settings.brandName,
      alternateName: practitioner ? settings.brandName : undefined,
      url: `${siteUrl}/about`,
      image: input.imageUrl,
      jobTitle: "Vedic astrologer and vastu consultant",
      knowsAbout: [...KNOWS_ABOUT],
      knowsLanguage: input.languages?.length ? input.languages : undefined,
      alumniOf: input.alumniOf?.length
        ? input.alumniOf.map((name) => ({ "@type": "Organization", name }))
        : undefined,
      award: input.awards?.length ? input.awards : undefined,
      sameAs: sameAs.length ? sameAs : undefined,
      worksFor: { "@id": schemaId(siteUrl, "organization"), "@type": "ProfessionalService" },
    }),
  );
}

export interface ProfessionalServiceSchemaInput {
  settings: SiteSettings;
  sameAs: string[];
  siteUrl: string;
  /** Country names served (from the locations table); becomes `areaServed`. */
  areaServed?: string[];
  priceRange?: string;
  imageUrl?: string;
}

export function professionalServiceSchema(
  input: ProfessionalServiceSchemaInput,
): WithContext<ProfessionalService> {
  const { settings, sameAs, siteUrl } = input;
  const realSameAs = sameAs.filter((u) => !u.includes("{{"));
  return withContext(
    compact<ProfessionalService>({
      "@type": ["ProfessionalService", "LocalBusiness"],
      "@id": schemaId(siteUrl, "organization"),
      name: settings.brandName,
      url: siteUrl,
      description: settings.tagline,
      image: input.imageUrl,
      telephone: realValue(settings.phone),
      email: realValue(settings.email),
      address: postalAddressFromSettings(settings),
      areaServed: input.areaServed?.length
        ? input.areaServed.map((name) => ({ "@type": "Country", name }))
        : undefined,
      openingHoursSpecification: openingHoursFromBusinessHours(settings.businessHours),
      priceRange: realValue(input.priceRange),
      sameAs: realSameAs.length ? realSameAs : undefined,
      founder: { "@id": schemaId(siteUrl, "person"), "@type": "Person" },
    }),
  );
}

export function webSiteSchema(input: { siteUrl: string; name: string }): WithContext<WebSite> {
  return withContext({
    "@type": "WebSite",
    "@id": schemaId(input.siteUrl, "website"),
    name: input.name,
    url: input.siteUrl,
    publisher: { "@id": schemaId(input.siteUrl, "organization"), "@type": "ProfessionalService" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${input.siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FaqItem[]): WithContext<FaqPage> {
  return withContext({
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  });
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbSchema(
  items: BreadcrumbItem[],
  siteUrl: string,
): WithContext<BreadcrumbList> {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: /^https?:\/\//i.test(item.href) ? item.href : `${siteUrl}${item.href}`,
    })),
  });
}

/** Add a `speakable` specification (voice assistants, Siri) pointing at answer blocks. */
export function withSpeakable<T extends Thing>(
  schema: T,
  cssSelectors: string[],
): T & { speakable: Thing } {
  return {
    ...schema,
    speakable: { "@type": "SpeakableSpecification", cssSelector: cssSelectors },
  };
}
