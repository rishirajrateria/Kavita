/**
 * `ContactPoint` JSON-LD for `/contact` (CLAUDE.md §8): emitted nested in the organisation
 * node (same `@id` as the site-wide `ProfessionalService`, so consumers merge them). Built from
 * `site_settings` only — placeholder values are omitted, so a `{{PHONE}}` never reaches the web.
 */
import type { SiteSettings } from "@/lib/data";
import {
  compact,
  openingHoursFromBusinessHours,
  schemaId,
  withContext,
  type Thing,
  type WithContext,
} from "@/lib/seo/schema";
import { realValue } from "@/lib/site";

export interface ContactPoint extends Thing {
  "@type": "ContactPoint";
  contactType: string;
  telephone?: string;
  email?: string;
  url?: string;
  availableLanguage?: string[];
  areaServed?: string[];
  hoursAvailable?: Thing[];
}

export interface OrganizationContact extends Thing {
  "@type": ["ProfessionalService", "LocalBusiness"];
  contactPoint: ContactPoint[];
}

export function contactPointSchema(input: {
  settings: SiteSettings;
  siteUrl: string;
  languages?: string[];
  areaServed?: string[];
}): WithContext<OrganizationContact> {
  const { settings, siteUrl } = input;
  const point = compact<ContactPoint>({
    "@type": "ContactPoint",
    "@id": `${siteUrl}/contact#contact-point`,
    contactType: "customer service",
    telephone: realValue(settings.phone),
    email: realValue(settings.email),
    url: `${siteUrl}/contact`,
    availableLanguage: input.languages?.length ? input.languages : undefined,
    areaServed: input.areaServed?.length ? input.areaServed : undefined,
    hoursAvailable: openingHoursFromBusinessHours(settings.businessHours),
  });
  return withContext({
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": schemaId(siteUrl, "organization"),
    contactPoint: [point],
  });
}
