/**
 * Row and value types page code needs, re-exported so components never import `@/db` or the
 * content folders directly. Location types come from the content schema (the contract);
 * `Location` is an alias of `LocationRecord` so Phase 1 callers keep working.
 */
export type {
  BusinessHours,
  BusinessHoursInterval,
  Currency,
  DeliveryMode,
  Faq,
  Integration,
  IntegrationProvider,
  Service,
  ServiceLead,
  ServicePrices,
  SiteSettings,
  SocialLink,
  SocialPlatform,
  Testimonial,
  Weekday,
} from "@/db/schema";

export type {
  ChartStyle,
  ClimateArchitecture,
  Currency as LocationCurrency,
  Hreflang,
  Landmark,
  LandmarkKind,
  LocationBase,
  LocationFaq,
  LocationRecord,
  LocationResearch,
  LocationType,
  MonthReckoning,
  PopulationTier,
  RegionalTradition,
  ResearchStatus,
} from "@/content/locations/schema";
export type { LocationRecord as Location } from "@/content/locations/schema";
export type { ConsultationWindow } from "./consultation-window";

/** The two geo-page families (CLAUDE.md §5). */
export const GEO_SERVICES = ["astrologer", "vastu-consultant"] as const;
export type GeoService = (typeof GEO_SERVICES)[number];
