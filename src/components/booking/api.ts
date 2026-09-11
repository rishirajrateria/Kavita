"use client";

/**
 * The island's only network code: `POST /api/bookings` and `POST /api/uploads/floor-plan`,
 * plus the mapping from every API outcome to a `SubmitFailure` the screens can explain.
 * Nothing here logs; the payload carries personal data and is sent exactly once.
 */
import type { FlowState } from "./state";
import type { BookableService, Slot, SubmitResult } from "./types";

export type FloorPlanUpload =
  | { ok: true; storagePath: string; fileName: string }
  | { ok: false; reason: "unavailable" | "too_large" | "wrong_type" | "failed" };

export const FLOOR_PLAN_MAX_BYTES = 10 * 1024 * 1024;
export const FLOOR_PLAN_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export async function uploadFloorPlan(file: File): Promise<FloorPlanUpload> {
  if (file.size > FLOOR_PLAN_MAX_BYTES) return { ok: false, reason: "too_large" };
  if (!(FLOOR_PLAN_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: "wrong_type" };
  }
  const body = new FormData();
  body.set("file", file);
  try {
    const res = await fetch("/api/uploads/floor-plan", {
      method: "POST",
      body,
      headers: { accept: "application/json" },
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      storage_path?: string;
      storagePath?: string;
      reason?: string;
    } | null;
    if (res.status === 503 || data?.reason === "not_connected") {
      return { ok: false, reason: "unavailable" };
    }
    const storagePath = data?.storage_path ?? data?.storagePath;
    if (!res.ok || !storagePath) {
      if (data?.reason === "too_large") return { ok: false, reason: "too_large" };
      if (data?.reason === "unsupported_type") return { ok: false, reason: "wrong_type" };
      return { ok: false, reason: "failed" };
    }
    return { ok: true, storagePath, fileName: file.name };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

const needsBirth = (service: BookableService) =>
  service.lead === "astrology" || service.lead === "integrated";
const needsProperty = (service: BookableService) =>
  service.lead === "vastu" || service.lead === "integrated";

export { needsBirth, needsProperty };

/** The body of `POST /api/bookings` — the flat shape of P4-A's `bookingRequestSchema`. */
export function buildPayload(
  state: FlowState,
  service: BookableService,
  locationPath: string | null,
): Record<string, unknown> {
  const d = state.details;
  const gender =
    d.gender === "unspecified" ? "" : d.gender === "self" ? d.genderSelf.trim() : d.gender;
  const birth = needsBirth(service);
  const property = needsProperty(service);
  return {
    serviceSlug: service.slug,
    mode: state.mode ?? "",
    startsAt: state.slot?.startsAt ?? "",
    clientTimezone: state.clientTz,
    fullName: d.name,
    email: d.email,
    dialCode: d.dialCode,
    customDialCode: d.customDialCode,
    phone: d.phone,
    preferredLanguage: d.preferredLanguage,
    birthDate: birth ? d.birthDate : "",
    birthTime: birth && d.birthTimeAccuracy !== "unknown" ? d.birthTime : "",
    birthPlace: birth ? d.birthPlace : "",
    birthTimeAccuracy: birth ? d.birthTimeAccuracy : undefined,
    propertyType: property && d.propertyType ? d.propertyType : undefined,
    floorPlanPath: property ? (d.floorPlan?.storagePath ?? "") : "",
    compassReading: property ? d.entranceFacing : "",
    gender,
    question: state.question,
    locationPath: locationPath ?? "",
    marketingConsent: d.marketingConsent,
  };
}

interface ApiSuccess {
  ok: true;
  token?: string;
  manageToken?: string;
  booking?: {
    id?: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
    manageToken?: string;
  };
  bookingId?: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
}

interface ApiFailure {
  ok: false;
  reason?: string;
  errors?: Record<string, string[]>;
  alternatives?: Slot[];
}

export async function postBooking(payload: Record<string, unknown>): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, kind: "network" };
  }
  const data = (await res.json().catch(() => null)) as ApiSuccess | ApiFailure | null;

  if (data?.ok) {
    const token = data.token ?? data.manageToken ?? data.booking?.manageToken ?? null;
    const startsAt = data.booking?.startsAt ?? data.startsAt ?? (payload.startsAt as string);
    const endsAt = data.booking?.endsAt ?? data.endsAt ?? (payload.endsAt as string);
    if (!token) return { ok: false, kind: "server" };
    return {
      ok: true,
      receipt: {
        token,
        bookingId: data.booking?.id ?? data.bookingId ?? null,
        startsAt,
        endsAt,
        status: data.booking?.status ?? data.status ?? null,
      },
    };
  }

  const reason = data && !data.ok ? data.reason : undefined;
  if (res.status === 503 || reason === "not_connected") return { ok: false, kind: "not_connected" };
  if (res.status === 429 || reason === "rate_limited") return { ok: false, kind: "rate_limited" };
  if (reason === "slot_taken" || reason === "slot_unavailable") {
    const alternatives = data && !data.ok ? (data.alternatives ?? []) : [];
    if (alternatives.length > 0) return { ok: false, kind: "slot_taken", alternatives };
    return { ok: false, kind: "slot_gone" };
  }
  if (reason === "validation") {
    return { ok: false, kind: "validation", errors: data && !data.ok ? (data.errors ?? {}) : {} };
  }
  return { ok: false, kind: "server" };
}

/** Pre-filled WhatsApp/email text for the 503 fallback — never includes birth details. */
export function fallbackSummary(input: {
  service: string;
  mode: string;
  whenClient: string;
  whenPractitioner: string | null;
  name: string;
  question: string;
}): string {
  const lines = [
    `Hello, I would like to book: ${input.service}`,
    `Format: ${input.mode}`,
    `Preferred time: ${input.whenClient}${input.whenPractitioner ? ` (${input.whenPractitioner})` : ""}`,
    input.name ? `Name: ${input.name}` : null,
    input.question ? `About: ${input.question}` : null,
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}
