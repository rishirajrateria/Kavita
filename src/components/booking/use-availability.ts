"use client";

/**
 * Fetches `GET /api/availability?service=&month=&tz=` per (service, month, zone) and caches
 * each answer for the life of the island, so moving between months is instant the second time.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { AvailabilityResponse, Slot } from "./types";

export type AvailabilityStatus = "idle" | "loading" | "ready" | "error";

export interface Availability {
  status: AvailabilityStatus;
  /** `YYYY-MM-DD` (client-local) → free slots that day. */
  days: ReadonlyMap<string, Slot[]>;
  practitionerTz: string | null;
  reload: () => void;
}

const EMPTY: ReadonlyMap<string, Slot[]> = new Map();

export function availabilityUrl(service: string, month: string, tz: string): string {
  const params = new URLSearchParams({ service, month, tz });
  return `/api/availability?${params.toString()}`;
}

function toMap(data: AvailabilityResponse): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const day of data.days ?? []) {
    if (!day || typeof day.date !== "string") continue;
    const slots = (day.slots ?? []).filter(
      (s) => s && typeof s.startsAt === "string" && typeof s.endsAt === "string",
    );
    if (slots.length > 0) map.set(day.date, slots);
  }
  return map;
}

export function useAvailability(
  service: string | null,
  month: string,
  tz: string,
  enabled: boolean,
): Availability {
  const cache = useRef(new Map<string, AvailabilityResponse>());
  const [state, setState] = useState<{
    key: string | null;
    status: AvailabilityStatus;
    data: AvailabilityResponse | null;
  }>({ key: null, status: "idle", data: null });
  const [attempt, setAttempt] = useState(0);

  const key = service ? `${service}|${month}|${tz}` : null;

  useEffect(() => {
    if (!enabled || !service || !key) return;
    const cached = cache.current.get(key);
    if (cached) {
      setState({ key, status: "ready", data: cached });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ key, status: "loading", data: s.key === key ? s.data : null }));
    fetch(availabilityUrl(service, month, tz), {
      signal: controller.signal,
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as AvailabilityResponse | null;
        if (!res.ok || !data || !Array.isArray(data.days)) throw new Error("availability");
        cache.current.set(key, data);
        setState({ key, status: "ready", data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ key, status: "error", data: null });
      });
    return () => controller.abort();
  }, [enabled, service, month, tz, key, attempt]);

  const reload = useCallback(() => {
    if (key) cache.current.delete(key);
    setAttempt((n) => n + 1);
  }, [key]);

  const current = state.key === key ? state : { status: "loading" as const, data: null };
  return {
    status: enabled ? current.status : "idle",
    days: current.data ? toMap(current.data) : EMPTY,
    practitionerTz: current.data?.practitionerTz ?? null,
    reload,
  };
}
