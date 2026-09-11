import "server-only";
import { cache } from "react";
import {
  INTEGRATION_LABELS,
  LEGAL_DOCUMENTS,
  type LegalContext,
  type LegalDocument,
  type LegalSlug,
} from "@/content/legal";
import { getIntegrations, getSiteSettings } from "@/lib/data";

/**
 * Everything a legal document interpolates, read from `site_settings` and the enabled
 * `integrations` rows (CLAUDE.md §10, §13). Placeholder strings pass through untouched so the
 * build gate can still see them.
 */
export const getLegalContext = cache(async (): Promise<LegalContext> => {
  const [settings, integrations] = await Promise.all([getSiteSettings(), getIntegrations()]);
  const enabledIntegrations = integrations
    .map((i) => INTEGRATION_LABELS[i.provider])
    .filter((label): label is string => label !== null);

  return {
    brandName: settings.brandName,
    legalEntity: settings.legalEntity,
    practitionerName: settings.practitionerName,
    email: settings.email,
    basedIn: `${settings.city}, ${settings.country}`,
    timezone: settings.timezone,
    enabledIntegrations,
  };
});

/** The finished document for a legal route, ready to render or to describe in metadata. */
export const getLegalDocument = cache(async (slug: LegalSlug): Promise<LegalDocument> => {
  const ctx = await getLegalContext();
  return LEGAL_DOCUMENTS[slug](ctx);
});
