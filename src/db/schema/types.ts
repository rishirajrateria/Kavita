/**
 * Committed row types — Drizzle's `$inferSelect` / `$inferInsert` are the generated types for
 * this project (no separate codegen step).
 */
import type { adminAuditLog, adminUsers } from "./admin";
import type {
  analyticsDailyRollup,
  analyticsEvents,
  analyticsPageviews,
  analyticsSessions,
} from "./analytics";
import type {
  availabilityExceptions,
  availabilityRules,
  bookingStatusHistory,
  bookings,
  clients,
  floorPlans,
  notificationLog,
  payments,
} from "./booking";
import type { bookingNotes, featureFlags, notificationTemplates } from "./flags";
import type { articleCategories, articles, faqs, glossaryTerms, testimonials } from "./content";
import type { locations } from "./locations";
import type { pageSeo, redirects } from "./seo";
import type { serviceTranslations, services } from "./services";
import type { consentLog, integrations, siteSettings, socialLinks, verificationTags } from "./site";

export type SiteSettings = typeof siteSettings.$inferSelect;
export type NewSiteSettings = typeof siteSettings.$inferInsert;
export type SocialLink = typeof socialLinks.$inferSelect;
export type NewSocialLink = typeof socialLinks.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type VerificationTag = typeof verificationTags.$inferSelect;
export type NewVerificationTag = typeof verificationTags.$inferInsert;
export type ConsentLogEntry = typeof consentLog.$inferSelect;
export type NewConsentLogEntry = typeof consentLog.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type ServiceTranslation = typeof serviceTranslations.$inferSelect;
export type NewServiceTranslation = typeof serviceTranslations.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type PageSeo = typeof pageSeo.$inferSelect;
export type NewPageSeo = typeof pageSeo.$inferInsert;
export type Redirect = typeof redirects.$inferSelect;
export type NewRedirect = typeof redirects.$inferInsert;

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type NewArticleCategory = typeof articleCategories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type GlossaryTerm = typeof glossaryTerms.$inferSelect;
export type NewGlossaryTerm = typeof glossaryTerms.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type AvailabilityException = typeof availabilityExceptions.$inferSelect;
export type NewAvailabilityException = typeof availabilityExceptions.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingStatusHistoryEntry = typeof bookingStatusHistory.$inferSelect;
export type NewBookingStatusHistoryEntry = typeof bookingStatusHistory.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type NotificationLogEntry = typeof notificationLog.$inferSelect;
export type NewNotificationLogEntry = typeof notificationLog.$inferInsert;
export type FloorPlan = typeof floorPlans.$inferSelect;
export type NewFloorPlan = typeof floorPlans.$inferInsert;

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type NewAnalyticsSession = typeof analyticsSessions.$inferInsert;
export type AnalyticsPageview = typeof analyticsPageviews.$inferSelect;
export type NewAnalyticsPageview = typeof analyticsPageviews.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type AnalyticsDailyRollup = typeof analyticsDailyRollup.$inferSelect;
export type NewAnalyticsDailyRollup = typeof analyticsDailyRollup.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
export type BookingNote = typeof bookingNotes.$inferSelect;
export type NewBookingNote = typeof bookingNotes.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
