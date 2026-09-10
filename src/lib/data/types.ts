/**
 * Row and value types page code needs, re-exported from the Drizzle schema so components never
 * import `@/db` directly.
 */
export type {
  BusinessHours,
  BusinessHoursInterval,
  ClientConcern,
  ClimateArchitecture,
  ConsultationWindow,
  Currency,
  DeliveryMode,
  Faq,
  Integration,
  IntegrationProvider,
  Landmark,
  Location,
  LocationFaq,
  LocationType,
  PopulationTier,
  RegionalTradition,
  ResearchStatus,
  Service,
  ServiceLead,
  ServicePrices,
  SiteSettings,
  SocialLink,
  SocialPlatform,
  Testimonial,
  Weekday,
} from "@/db/schema";

/** The two geo-page families (CLAUDE.md §5). */
export const GEO_SERVICES = ["astrologer", "vastu-consultant"] as const;
export type GeoService = (typeof GEO_SERVICES)[number];
