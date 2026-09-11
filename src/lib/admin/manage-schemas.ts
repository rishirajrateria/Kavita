/**
 * Zod schemas for every management mutation (`/api/admin/*`, Phase 5 P5-C). Client-safe: the
 * forms validate with these before posting and the route handlers validate again (CLAUDE.md §3).
 * Bodies are flat so a JavaScript-free `<form>` can post the same fields.
 */
import { z } from "zod";
import { ADMIN_ROLES } from "@/db/schema/admin";
import { BOOKING_STATUSES } from "@/db/schema/booking";
import { TESTIMONIAL_SOURCES } from "@/db/schema/content";
import { FEATURE_FLAG_KEYS, TEMPLATE_RECIPIENTS } from "@/db/schema/flags";
import { CURRENCIES } from "@/db/schema/_shared";
import { DELIVERY_MODES, SERVICE_LEADS } from "@/db/schema/services";
import { SOCIAL_PLATFORMS, WEEKDAYS } from "@/db/schema/site";
import { locationResearchSchema } from "@/content/locations/schema";
import { NOTIFICATION_KINDS } from "@/lib/notifications/types";
import { isSocialPlatform, validateSocialUrl } from "./social-validators";

export const uuidSchema = z.uuid();
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** `true`, `"true"`, `"on"`, `"1"` → true; anything else → false. Form-tolerant. */
export const formBoolean = z
  .union([z.boolean(), z.string(), z.number(), z.undefined(), z.null()])
  .transform((v) => v === true || v === 1 || v === "true" || v === "on" || v === "1");

const formInt = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
/** Textarea → string[] (one item per line) or an actual array. */
export const lines = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((v) =>
    (Array.isArray(v) ? v : (v ?? "").split(/\r?\n/)).map((s) => s.trim()).filter(Boolean),
  );

export const instantSchema = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

// --- bookings --------------------------------------------------------------------------------

export const bookingListQuerySchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  service: z.string().trim().max(80).optional(),
  from: z.string().regex(DATE).optional(),
  to: z.string().regex(DATE).optional(),
  location: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["starts_at", "created_at"]).default("starts_at"),
  dir: z.enum(["asc", "desc"]).default("asc"),
});
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;

export const bookingActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({
    action: z.literal("reschedule"),
    startsAt: instantSchema,
    notifyClient: formBoolean.default(true),
  }),
  z.object({
    action: z.literal("cancel"),
    reason: text(500).min(3),
    notifyClient: formBoolean.default(true),
  }),
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("no_show") }),
]);
export type BookingAction = z.infer<typeof bookingActionSchema>;

export const bookingNoteSchema = z.object({ body: text(4000).min(1) });

// --- testimonials -----------------------------------------------------------------------------

export const testimonialUpdateSchema = z.object({
  clientName: text(120).min(2).optional(),
  quote: text(2000).min(10).optional(),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional(),
  date: z.string().regex(DATE).nullable().optional(),
  source: z.enum(TESTIMONIAL_SOURCES).optional(),
  consentGiven: formBoolean.optional(),
  isPublished: formBoolean.optional(),
  serviceId: uuidSchema.nullable().optional(),
  clientLocationId: uuidSchema.nullable().optional(),
});

// --- services ---------------------------------------------------------------------------------

const prices = z
  .record(z.enum(CURRENCIES), z.coerce.number().int().min(0))
  .optional()
  .transform((v) => v ?? {});

export const serviceUpdateSchema = z.object({
  name: text(120).min(2).optional(),
  lead: z.enum(SERVICE_LEADS).optional(),
  durationMinutes: formInt(15, 480).optional(),
  bufferBeforeMinutes: formInt(0, 120).optional(),
  bufferAfterMinutes: formInt(0, 120).optional(),
  priceMinor: z.coerce.number().int().min(0).nullable().optional(),
  currency: z.enum(CURRENCIES).nullable().optional(),
  prices: prices.optional(),
  priceNote: optionalText(160).optional(),
  shortDescription: text(300).min(10).optional(),
  description: text(4000).min(20).optional(),
  whatToPrepare: lines.optional(),
  whatYouReceive: lines.optional(),
  deliveryModes: z.array(z.enum(DELIVERY_MODES)).optional(),
  sortOrder: formInt(0, 999).optional(),
  isActive: formBoolean.optional(),
});

// --- faqs -------------------------------------------------------------------------------------

const faqBase = z.object({
  routePattern: optionalText(200),
  locationId: uuidSchema.nullable().optional(),
  question: text(300).min(10),
  answer: text(1200).min(20),
  sortOrder: formInt(0, 999).default(0),
  isPublished: formBoolean.default(false),
});
export const faqSchema = faqBase.refine((f) => f.routePattern || f.locationId, {
  message: "Attach the FAQ to a route or a location",
  path: ["routePattern"],
});
export const faqUpdateSchema = faqBase.partial();

// --- locations --------------------------------------------------------------------------------

export const locationUpdateSchema = z.object({
  /** `null` clears the research (the location becomes a stub and stops rendering). */
  research: locationResearchSchema.nullable().optional(),
  isFeatured: formBoolean.optional(),
  contentUpdatedAt: z.string().regex(DATE).optional(),
});

// --- availability -----------------------------------------------------------------------------

export const availabilityRuleSchema = z
  .object({
    weekday: formInt(0, 6),
    startTime: z.string().regex(CLOCK, "HH:MM"),
    endTime: z.string().regex(CLOCK, "HH:MM"),
    serviceId: uuidSchema.nullable().optional(),
    isActive: formBoolean.default(true),
  })
  .refine((r) => r.startTime < r.endTime, {
    message: "End must be after start",
    path: ["endTime"],
  });

export const availabilityWeekSchema = z.object({
  rules: z.array(availabilityRuleSchema).max(70),
});

/** Whole days in the practitioner's zone; the route turns them into instants. */
export const availabilityExceptionFormSchema = z
  .object({
    fromDate: z.string().regex(DATE, "YYYY-MM-DD"),
    toDate: z.string().regex(DATE, "YYYY-MM-DD"),
    isBlocked: formBoolean.default(true),
    reason: optionalText(200),
  })
  .refine((e) => e.toDate >= e.fromDate, {
    message: "End must not be before start",
    path: ["toDate"],
  });

export const availabilityExceptionSchema = z
  .object({
    startsAt: instantSchema,
    endsAt: instantSchema,
    isBlocked: formBoolean.default(true),
    reason: optionalText(200),
  })
  .refine((e) => e.endsAt.getTime() > e.startsAt.getTime(), {
    message: "End must be after start",
    path: ["endsAt"],
  });

// --- notification templates --------------------------------------------------------------------

export const notificationTemplateSchema = z.object({
  kind: z.enum(NOTIFICATION_KINDS),
  recipient: z.enum(TEMPLATE_RECIPIENTS).default("client"),
  subject: optionalText(160),
  intro: optionalText(1200),
  isEnabled: formBoolean.default(true),
});

// --- admin users ------------------------------------------------------------------------------

export const adminInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email())
    .transform((e) => e.toLowerCase()),
  displayName: text(80).min(2),
  role: z.enum(ADMIN_ROLES).default("editor"),
});
export const adminUserUpdateSchema = z.object({
  role: z.enum(ADMIN_ROLES).optional(),
  isActive: formBoolean.optional(),
  displayName: text(80).min(2).optional(),
});

// --- feature flags ----------------------------------------------------------------------------

export const featureFlagSchema = z.object({
  key: z.enum(FEATURE_FLAG_KEYS),
  value: z.union([z.boolean(), z.string().max(200), z.number(), z.null()]),
  description: optionalText(300),
});

// --- site settings ----------------------------------------------------------------------------

const interval = z
  .object({ open: z.string().regex(CLOCK), close: z.string().regex(CLOCK) })
  .refine((i) => i.open < i.close, "close must be after open");
export const businessHoursSchema = z.object(
  Object.fromEntries(WEEKDAYS.map((d) => [d, z.array(interval).max(3).nullable()])) as Record<
    (typeof WEEKDAYS)[number],
    z.ZodNullable<z.ZodArray<typeof interval>>
  >,
);

export const siteSettingsUpdateSchema = z.object({
  brandName: text(80).min(2).optional(),
  legalEntity: text(120).min(2).optional(),
  practitionerName: text(80).min(2).optional(),
  tagline: text(200).optional(),
  phone: text(40).optional(),
  whatsapp: text(40).optional(),
  email: text(254).optional(),
  addressLine1: optionalText(120).optional(),
  addressLine2: optionalText(120).optional(),
  addressPostalCode: optionalText(20).optional(),
  addressRegion: optionalText(80).optional(),
  city: text(80).optional(),
  country: text(80).optional(),
  timezone: text(64).optional(),
  defaultCurrency: z.enum(CURRENCIES).optional(),
  businessHours: businessHoursSchema.optional(),
  inPersonAvailable: formBoolean.optional(),
  responseTimeHours: formInt(1, 168).optional(),
  leadTimeHours: formInt(0, 720).optional(),
  horizonDays: formInt(1, 365).optional(),
  rescheduleNoticeHours: formInt(0, 720).optional(),
  slotStepMinutes: formInt(5, 120).optional(),
});

// --- social links ------------------------------------------------------------------------------

const socialBase = z.object({
  platform: z.string().refine(isSocialPlatform, "Choose a platform"),
  url: text(500).min(4),
  label: text(120).min(2),
  icon: text(40).optional(),
  sortOrder: formInt(0, 999).default(0),
  isVisible: formBoolean.default(true),
  showInFooter: formBoolean.default(true),
  showInHeader: formBoolean.default(false),
  includeInSameas: formBoolean.default(true),
});

/** Runs the per-platform validator and stores the normalised URL. */
export const socialLinkSchema = socialBase.transform((data, ctx) => {
  if (!isSocialPlatform(data.platform)) return z.NEVER;
  const result = validateSocialUrl(data.platform, data.url);
  if (!result.ok) {
    ctx.addIssue({ code: "custom", path: ["url"], message: result.error });
    return z.NEVER;
  }
  return { ...data, platform: data.platform, url: result.url, icon: data.icon || data.platform };
});
export const socialLinkUpdateSchema = socialBase.partial().transform((data, ctx) => {
  if (data.url !== undefined) {
    if (!data.platform || !isSocialPlatform(data.platform)) {
      ctx.addIssue({
        code: "custom",
        path: ["platform"],
        message: "Platform is required with url",
      });
      return z.NEVER;
    }
    const result = validateSocialUrl(data.platform, data.url);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", path: ["url"], message: result.error });
      return z.NEVER;
    }
    return { ...data, platform: data.platform, url: result.url };
  }
  return {
    ...data,
    platform: data.platform && isSocialPlatform(data.platform) ? data.platform : undefined,
  };
});
export const socialReorderSchema = z.object({ ids: z.array(uuidSchema).min(1).max(50) });

export { SOCIAL_PLATFORMS };
