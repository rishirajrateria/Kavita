/**
 * Types shared by the booking island and the server pages that mount it. Only serialisable
 * data crosses the server → client boundary; secrets and personal data never do.
 */
import type { DeliveryMode, ServiceLead } from "@/lib/data";

export type BookingMode = "online_video" | "online_phone" | "in_person";

/** API contract (P4-A): every instant is an ISO-8601 UTC string. */
export interface Slot {
  startsAt: string;
  endsAt: string;
}

export interface AvailabilityDay {
  /** `YYYY-MM-DD` in the client's zone. */
  date: string;
  slots: Slot[];
}

export interface AvailabilityResponse {
  days: AvailabilityDay[];
  practitionerTz: string;
  clientTz: string;
}

/** The subset of a `Service` row the flow needs — passed from the server page. */
export interface BookableService {
  slug: string;
  name: string;
  lead: ServiceLead;
  durationMinutes: number;
  bufferAfterMinutes: number;
  shortDescription: string;
  whatToPrepare: string[];
  deliveryModes: DeliveryMode[];
  /** `"{{PRICE}}"` until supplied; the flow shows "confirmed before the session" for any placeholder. */
  priceNote: string | null;
  priceMinor: number | null;
  currency: string | null;
}

export interface BookingChannels {
  whatsapp: string | null;
  email: string | null;
  tel: string | null;
  emailText?: string;
  phoneText?: string;
}

export interface BookingLocation {
  path: string;
  name: string;
  timezone: string;
}

export interface BookingFlowProps {
  services: BookableService[];
  initialServiceSlug?: string;
  location?: BookingLocation | null;
  practitionerTz: string;
  practitionerCity: string;
  /** `site_settings.in_person_available` AND the visitor's location matches the practice city. */
  inPersonOffered: boolean;
  channels: BookingChannels;
  rescheduleNoticeHours: number;
  /** `YYYY-MM` the calendar opens on (server-computed so SSR and hydration agree). */
  initialMonth: string;
  /** ISO instant used for zone labels on the server render. */
  now: string;
}

export type BirthTimeAccuracy = "exact" | "approximate" | "unknown";
export type PropertyType =
  "apartment" | "independent_house" | "villa" | "office" | "shop" | "factory" | "plot" | "other";
export type Gender = "unspecified" | "woman" | "man" | "nonbinary" | "self";

export interface FloorPlanRef {
  storagePath: string;
  fileName: string;
}

export interface DetailsState {
  name: string;
  email: string;
  dialCode: string;
  customDialCode: string;
  phone: string;
  preferredLanguage: string;
  birthDate: string;
  birthTime: string;
  birthTimeAccuracy: BirthTimeAccuracy;
  birthPlace: string;
  propertyType: PropertyType | "";
  entranceFacing: string;
  floorPlan: FloorPlanRef | null;
  gender: Gender;
  genderSelf: string;
  marketingConsent: boolean;
}

/** What the confirmation screen needs from a successful `POST /api/bookings`. */
export interface BookingReceipt {
  token: string;
  bookingId: string | null;
  startsAt: string;
  endsAt: string;
  status: string | null;
}

export type SubmitFailure =
  | { kind: "validation"; errors: Record<string, string[]> }
  | { kind: "rate_limited" }
  | { kind: "not_connected" }
  | { kind: "slot_taken"; alternatives: Slot[] }
  | { kind: "slot_gone" }
  | { kind: "network" }
  | { kind: "server" };

export type SubmitResult = { ok: true; receipt: BookingReceipt } | ({ ok: false } & SubmitFailure);
