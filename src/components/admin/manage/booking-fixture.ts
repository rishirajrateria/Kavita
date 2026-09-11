/**
 * Static, obviously fictional booking data for the design preview route
 * (`/admin/bookings/preview`, never in production) and the list/calendar empty states'
 * screenshots. No real client data; nothing here is ever written to a database.
 */
import type { BookingDetail, BookingListRow } from "@/lib/admin/bookings";
import {
  SEED_NS,
  SITE_SETTINGS_KEY,
  hydrate,
  servicesSeed,
  siteSettingsSeed,
} from "@/content/seed";
import type { Booking, Service, SiteSettings } from "@/db/schema";

const NOW = new Date("2026-09-11T06:30:00Z");

function service(slug: string): Service {
  const seed = servicesSeed.find((s) => s.slug === slug) ?? servicesSeed[0]!;
  return hydrate<Service>(SEED_NS.services, seed.slug, seed);
}

export function fixtureSettings(): SiteSettings {
  return hydrate<SiteSettings>(SEED_NS.siteSettings, SITE_SETTINGS_KEY, siteSettingsSeed);
}

function booking(n: number, overrides: Partial<Booking>): Booking {
  const startsAt = overrides.startsAt ?? new Date(NOW.getTime() + n * 26 * 3_600_000);
  return {
    id: `f1e2d3c4-0000-4000-8000-00000000000${n}`,
    clientId: `c0000000-0000-4000-8000-00000000000${n}`,
    serviceId: service("kundli-analysis").id,
    locationId: null,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60_000),
    clientTimezone: "Asia/Kolkata",
    mode: "online_video",
    status: "confirmed",
    clientNotes: null,
    manageToken: `preview-token-${n}`,
    rescheduledFromId: null,
    createdAt: new Date(NOW.getTime() - n * 86_400_000),
    updatedAt: NOW,
    ...overrides,
  };
}

const PEOPLE = [
  ["Preview Client One", "one@example.invalid", "Asia/Kolkata", "confirmed"],
  ["Preview Client Two", "two@example.invalid", "America/New_York", "pending"],
  ["Preview Client Three", "three@example.invalid", "Asia/Dubai", "payment_pending_offline"],
  ["Preview Client Four", "four@example.invalid", "Europe/London", "completed"],
  ["Preview Client Five", "five@example.invalid", "Australia/Sydney", "cancelled"],
  ["Preview Client Six", "six@example.invalid", "Asia/Singapore", "no_show"],
] as const;

export function fixtureRows(): BookingListRow[] {
  const slugs = [
    "kundli-analysis",
    "integrated-life-reading",
    "vastu-for-home",
    "kundli-milan",
    "kundli-analysis",
    "muhurat-selection",
  ];
  return PEOPLE.map(([name, email, tz, status], i) => {
    const svc = service(slugs[i] ?? "kundli-analysis");
    return {
      booking: booking(i + 1, {
        clientTimezone: tz,
        status,
        serviceId: svc.id,
        mode: i % 3 === 1 ? "online_phone" : "online_video",
      }),
      clientName: name,
      clientEmail: email,
      serviceName: svc.name,
      serviceSlug: svc.slug,
      locationName: i === 1 ? "New York" : i === 2 ? "Dubai" : null,
    };
  });
}

export function fixtureDetail(): BookingDetail {
  const settings = fixtureSettings();
  const svc = service("integrated-life-reading");
  const b = booking(2, {
    serviceId: svc.id,
    clientTimezone: "America/New_York",
    status: "pending",
    startsAt: new Date("2026-09-18T13:30:00Z"),
    endsAt: new Date("2026-09-18T15:00:00Z"),
    clientNotes:
      "We are moving to a north-facing flat in Jersey City in November. Should we time the move, and is the kitchen placement a concern?\nProperty: apartment\nCompass: 12° NNE\nFloor plan: uploaded",
  });
  return {
    relations: {
      booking: b,
      client: {
        id: b.clientId,
        fullName: "Preview Client Two",
        email: "two@example.invalid",
        phone: "+1 2125550100",
        timezone: "America/New_York",
        preferredLanguage: "English",
        birthDetailsEncrypted: null,
        birthDetailsKeyId: null,
        marketingConsent: false,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
      },
      service: svc,
      settings,
    },
    client: {
      id: b.clientId,
      fullName: "Preview Client Two",
      email: "two@example.invalid",
      phone: "+1 2125550100",
      timezone: "America/New_York",
      preferredLanguage: "English",
      marketingConsent: false,
      createdAt: b.createdAt,
      updatedAt: b.createdAt,
    },
    birthDetails: {
      state: "shown",
      details: {
        date: "1988-04-12",
        time: "23:10",
        place: "Jaipur, Rajasthan",
        timeAccuracy: "exact",
      },
    },
    floorPlan: {
      plan: {
        id: "fp-preview",
        bookingId: b.id,
        storagePath: "floor-plans/2026/09/preview.pdf",
        contentType: "application/pdf",
        bytes: 812_000,
        uploadedAt: b.createdAt,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
      },
      signedUrl: null,
    },
    history: [
      {
        id: "h1",
        bookingId: b.id,
        fromStatus: null,
        toStatus: "pending",
        changedBy: "client",
        adminUserId: null,
        reason: "Booked online",
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
      },
    ],
    notes: [
      {
        id: "n1",
        bookingId: b.id,
        adminUserId: null,
        body: "Preview note: asked for a Hindi-speaking session if possible.",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    payments: [{ provider: "noop", status: "created", amountMinor: 900000, currency: "INR" }],
    isActive: true,
  };
}
